using {data.db as data } from '../db/vishnu';

@path: '/sap/odata/terminal'
service CatalogService {
    entity Orders as projection on data.Orders;
    entity Customers as projection on data.Customers;
    entity Products as projection on data.Products;
    entity LineItems as projection on data.LineItems;
    entity IntegrationLogs as projection on data.IntegrationLogs;
    entity Sales as projection on data.Sales;
}

