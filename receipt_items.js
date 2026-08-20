// Receipt item formatter: shows menu name + quantity + line total only.
// It intentionally does not expose unit price.
(function () {
  'use strict';

  window.formatReceiptItems = function (items) {
    if (!Array.isArray(items)) return [];
    return items.map(function (item) {
      var qty = Number(item.quantity ?? item.qty ?? 1) || 1;
      var total = Number(item.total ?? item.lineTotal ?? 0) || 0;
      return {
        name: String(item.name ?? item.menu ?? item.product ?? '').trim(),
        quantity: qty,
        total: total
      };
    });
  };

  window.receiptItemLine = function (item, formatMoney) {
    var qty = Number(item.quantity ?? item.qty ?? 1) || 1;
    var total = Number(item.total ?? item.lineTotal ?? 0) || 0;
    var name = String(item.name ?? item.menu ?? item.product ?? '').trim();
    return name + ' (x' + qty + ')\t' + formatMoney(total);
  };
})();
