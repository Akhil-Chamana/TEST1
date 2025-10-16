const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { Orders, LineItems, IntegrationLogs } = this.entities;

    // ----------------------
    // Before CREATE Orders — auto-fill default values
    // ----------------------
    this.before('CREATE', Orders, (req) => {
        const data = req.data;
        data.last_update_ts = data.last_update_ts || new Date().toISOString();
        data.printed_flag = data.printed_flag ?? false;
        data.fna_status = data.fna_status || 'NEW';
        data.lifecycle_status = data.lifecycle_status || 'CREATED';
    });

    // ----------------------
    // Before CREATE LineItems — auto-fill default values
    // ----------------------
    this.before('CREATE', LineItems, (req) => {
        const data = req.data;
        data.last_update_ts = data.last_update_ts || new Date().toISOString();
        data.status = data.status || 'NEW';
    });

    // ----------------------
    // Update Orders with Guardrails + Timestamp Auto-fill
    // ----------------------
    this.on('UPDATE', Orders, async (req) => {
        const incoming = req.data;
        const tx = cds.transaction(req);

        const [existingOrder] = await tx.read(Orders).where({ orderid: incoming.orderid });
        if (!existingOrder) {
            await tx.create(IntegrationLogs).entries({
                ID: cds.utils.uuid(),
                orderid: incoming.orderid,
                payload: JSON.stringify(incoming),
                received_ts: new Date(),
                status: 'ERROR',
                message: 'Order not found'
            });
            throw new Error(`Order ${incoming.orderid} not found`);
        }

        // Auto-fill last_update_ts if missing
        incoming.last_update_ts = incoming.last_update_ts || new Date().toISOString();

        // Timestamp guardrail
        if (new Date(incoming.last_update_ts) <= new Date(existingOrder.last_update_ts)) {
            await tx.create(IntegrationLogs).entries({
                ID: cds.utils.uuid(),
                orderid: incoming.orderid,
                payload: JSON.stringify(incoming),
                received_ts: new Date(),
                status: 'IGNORED',
                message: 'Older timestamp'
            });
            return { message: 'Ignored update - older timestamp' };
        }

        // Guarded fields - preserve original values
        const updatedOrder = {
            ...existingOrder,
            ...incoming,
            fna_status: incoming.fna_status || existingOrder.fna_status || 'NEW',
            planned_start: incoming.planned_start || existingOrder.planned_start,
            planned_end: incoming.planned_end || existingOrder.planned_end,
            lifecycle_status: incoming.lifecycle_status || existingOrder.lifecycle_status || 'IN_PROGRESS',
            printed_flag: incoming.printed_flag ?? existingOrder.printed_flag ?? false,
            last_update_ts: incoming.last_update_ts
        };

        await tx.update(Orders).set(updatedOrder).where({ orderid: incoming.orderid });

        await tx.create(IntegrationLogs).entries({
            ID: cds.utils.uuid(),
            orderid: incoming.orderid,
            payload: JSON.stringify(incoming),
            received_ts: new Date(),
            status: 'SUCCESS',
            message: 'Order updated'
        });

        return updatedOrder;
    });

    // ----------------------
    // Update LineItems — auto-fill timestamp + update header
    // ----------------------
    this.on('UPDATE', LineItems, async (req) => {
        const incoming = req.data;
        const tx = cds.transaction(req);

        const [existingItem] = await tx.read(LineItems).where({ lineitemid: incoming.lineitemid });
        if (!existingItem) {
            await tx.create(IntegrationLogs).entries({
                ID: cds.utils.uuid(),
                orderid: incoming.orderid,
                lineitemid: incoming.lineitemid,
                payload: JSON.stringify(incoming),
                received_ts: new Date(),
                status: 'ERROR',
                message: 'Line item not found'
            });
            throw new Error(`Line Item ${incoming.lineitemid} not found`);
        }

        // Auto-fill timestamp
        incoming.last_update_ts = incoming.last_update_ts || new Date().toISOString();

        // Timestamp guardrail
        if (new Date(incoming.last_update_ts) <= new Date(existingItem.last_update_ts)) {
            await tx.create(IntegrationLogs).entries({
                ID: cds.utils.uuid(),
                orderid: incoming.orderid,
                lineitemid: incoming.lineitemid,
                payload: JSON.stringify(incoming),
                received_ts: new Date(),
                status: 'IGNORED',
                message: 'Older timestamp'
            });
            return { message: 'Ignored line item update - older timestamp' };
        }

        // Apply update
        const updatedItem = {
            ...existingItem,
            ...incoming,
            status: incoming.status || existingItem.status || 'UPDATED',
            last_update_ts: incoming.last_update_ts
        };

        // Reject/Delete simulation
        if (incoming.status === 'REJECTED') updatedItem.is_rejected = true;
        if (incoming.status === 'DELETED') updatedItem.is_deleted = true;

        await tx.update(LineItems).set(updatedItem).where({ lineitemid: incoming.lineitemid });

        // Update parent Order header_status based on first line item
        const lineItems = await tx.read(LineItems)
            .where({ orderid: incoming.orderid })
            .orderBy('lineitemid ASC');
        if (lineItems.length) {
            const firstStatus = lineItems[0].status;
            await tx.update(Orders).set({ header_status: firstStatus }).where({ orderid: incoming.orderid });
        }

        // Log
        await tx.create(IntegrationLogs).entries({
            ID: cds.utils.uuid(),
            orderid: incoming.orderid,
            lineitemid: incoming.lineitemid,
            payload: JSON.stringify(incoming),
            received_ts: new Date(),
            status: 'SUCCESS',
            message: 'Line item updated'
        });

        return updatedItem;
    });
});
