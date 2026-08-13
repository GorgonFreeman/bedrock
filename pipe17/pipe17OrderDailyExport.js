const { funcApi, logDeep, askQuestion, dateFromNow, days } = require('../utils');
const { pipe17OrdersGet } = require('./pipe17OrdersGet');

const pipe17OrderDailyExport = async (
  {
    credsPath,
  } = {},
) => {

  const since = new Date(dateFromNow({ dateOnly: true, minus: days(1) }));
  const until = new Date(dateFromNow({ dateOnly: true }));
  logDeep({ since, until });
  await askQuestion('Continue?');

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