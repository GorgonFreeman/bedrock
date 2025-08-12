// https://loyaltyapi.yotpo.com/reference/adjust-a-customers-point-balance

const { respond, mandateParam, logDeep, objHasAny, strictlyFalsey } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerPointsAdjust = async ( 
  credsPath,
  {
    customerId,
    customerEmail,
  },
  pointsAmount,
  {
    apiVersion,
    applyAdjustmentToPointsEarned,
    historyTitle,
    visibleToCustomer = true,
  } = {},
) => {

  const params = {
    point_adjustment_amount: pointsAmount,
    ...customerId && { customer_id: customerId },
    ...customerEmail && { customer_email: customerEmail },
    ...historyTitle && { history_title: historyTitle },
    ...!strictlyFalsey(applyAdjustmentToPointsEarned) && { apply_adjustment_to_points_earned: applyAdjustmentToPointsEarned },
    ...!strictlyFalsey(visibleToCustomer) && { visible_to_customer: visibleToCustomer },
  };

  const response = await yotpoClient.fetch({
    url: `/points/adjust`,
    method: 'post',
    params,
    context: {
      credsPath,
      apiVersion,
    },
  });
  logDeep(response);
  return response;
};

const yotpoCustomerPointsAdjustApi = async (req, res) => {
  const { 
    credsPath,
    customerIdentifier,
    pointsAmount,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerIdentifier', customerIdentifier, p => objHasAny(p, ['customerId', 'customerEmail'])),
    mandateParam(res, 'pointsAmount', pointsAmount),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await yotpoCustomerPointsAdjust(
    credsPath,
    customerIdentifier,
    pointsAmount,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerPointsAdjust,
  yotpoCustomerPointsAdjustApi,
};

// curl localhost:8000/yotpoCustomerPointsAdjust -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "john+testing@whitefoxboutique.com" }, "pointsAmount": 100 }'
// curl localhost:8000/yotpoCustomerPointsAdjust -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "john+testing@whitefoxboutique.com" }, "pointsAmount": 101, "options": { "historyTitle": "Dalmatians", "applyAdjustmentToPointsEarned": true, "visibleToCustomer": false } }'