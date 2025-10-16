namespace data.db;

entity Orders {
    key orderid   : String(50);
        ordername : String(50);
        customerid : String(50);
        productid  : String(50);
        fna_status : String(50);
        planned_start : DateTime;
        planned_end   : DateTime;
        lifecycle_status : String(50);
        last_update_ts  : DateTime;
        printed_flag : Boolean;
}

entity LineItems {
    key lineitemid       : String(50);
    orderid             : String(50);
    productid           : String(50);
    quantity            : Integer;
    status              : String(20);
    is_rejected         : Boolean default false;
    is_deleted          : Boolean default false;
    last_update_ts      : DateTime;
}

entity IntegrationLogs {
    key ID              : UUID;
    orderid             : String(50);
    lineitemid          : String(50);
    payload             : LargeString;
    received_ts         : DateTime;
    status              : String(20);
    message             : String(200);
}

entity Customers {
    key customerid : String(50);
        customername : String(100);
        city : String(100);
}

entity Products {
    key productid : String(50);
        productname : String(100);
        price : Decimal(10,2);
}

entity Sales {
    key saleid : String(50);
        orderid : String(50);
        totalamount : Decimal(10,2);
        saledate : Date;
}

