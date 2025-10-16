sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("webapp.App", {
        onInit: function () {
            console.log("App Controller initialized");
        },
        displayValue: function (sValue) {
            return sValue || "-";
        }
    });
});
