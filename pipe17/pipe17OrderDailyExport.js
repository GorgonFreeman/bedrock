const { funcApi, logDeep, askQuestion, dateFromNow, days } = require('../utils');
const { pipe17OrdersGet } = require('./pipe17OrdersGet');
const { pipe17OrderGet } = require('./pipe17OrderGet');

const pipe17OrderDailyExport = async (
  {
    credsPath,
  } = {},
) => {

  const since = new Date(dateFromNow({ dateOnly: true, minus: days(1) })).toISOString();
  const until = new Date(dateFromNow({ dateOnly: true })).toISOString();

  // Fetch all orders for the current day
  const ordersResponse = await pipe17OrdersGet({
    credsPath,
    since,
    until,
    count: 2000, // Page size
  });

  const { success: ordersSuccess, result: orders } = ordersResponse;
  if (!ordersSuccess) {
    return {
      success: false,
      message: 'Failed to fetch orders',
    };
  }

  // Fetch more order details
  const detailedOrders = await Promise.all(orders.map(async (order) => {
    const detailedOrderResponse = await pipe17OrderGet({
      credsPath,
      orderId: order.orderId,
    });
    const { success: detailedOrderSuccess, result: detailedOrder } = detailedOrderResponse;
    if (!detailedOrderSuccess) {
      return order;
    }
    logDeep(detailedOrder);
    return detailedOrder;
  }));

  // Calculate units sold
  const unitsSold = detailedOrders.reduce((acc, order) => {
    for (const lineItem of order.lineItems || []) {
      const { sku, quantity = 0 } = lineItem;
      if (!sku) {
        continue;
      }
      acc[sku] = (acc[sku] || 0) + quantity;
    }
    return acc;
  }, {});

  // Upload to google sheets
  
  logDeep(response);
  return response;
};

const pipe17OrderDailyExportApi = funcApi(pipe17OrderDailyExport, {
  argNames: ['options'],
});

module.exports = {
  pipe17OrderDailyExport,
  pipe17OrderDailyExportApi,
};

// curl localhost:8000/pipe17OrderDailyExport