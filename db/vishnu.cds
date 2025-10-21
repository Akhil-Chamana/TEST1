namespace data.db;

using { managed, cuid  } from '@sap/cds/common';

entity Orders : managed, cuid{
    key orderid      : UUID;        // UUID auto-filled
    ordername        : String(50);
    customerid       : UUID;
    productid        : UUID;

    fna_status       : String(50)  @default:'NEW';
    lifecycle_status : String(50)  @default:'CREATED';
    printed_flag     : Boolean     @default:false;

    planned_start    : Timestamp;
    planned_end      : Timestamp;
}

/**
 * Line Items entity
 */
entity LineItems :  cuid {
    key lineitemid      : UUID;       
        orderid         : UUID;
        productid       : UUID;
        quantity        : Integer;
        status          : String(20)  @default:'NEW';
        is_rejected     : Boolean      @default:false;
        is_deleted      : Boolean      @default:false;
}

/**
 * Integration Logs entity
 */
entity IntegrationLogs : cuid {
    key ID            : UUID;
        orderid       : UUID;
        lineitemid    : UUID;
        payload       : LargeString;
        status        : String(20);
        message       : String(200);
}

/**
 * Customers entity
 */
entity Customers :  cuid {
    key customerid    : UUID;       
        customername  : String(100);
        city          : String(100);
}

/**
 * Products entity
 */
entity Products :cuid {
    key productid     : UUID;       
        productname   : String(100);
        price         : Decimal(10,2);
}

/**
 * Sales entity
 */
entity Sales : managed,cuid {
    key saleid        : UUID;       
        orderid       : UUID;
        totalamount   : Decimal(10,2);
        saledate      : Timestamp; 
}
