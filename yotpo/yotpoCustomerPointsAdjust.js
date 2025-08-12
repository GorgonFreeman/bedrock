// https://loyaltyapi.yotpo.com/reference/adjust-a-customers-point-balance

const { respond, mandateParam, logDeep, objHasAny } = require('../utils');
const { yotpoClient } = require('../yotpo/yotpo.utils');

const yotpoCustomerPointsAdjust = async ( 
  credsPath,
  {
    customerId,
    customerEmail,
    customerPhone,
    posAccountId,
    pointAdjustmentAmount,
    applyAdjustmentToPointsEarned,
    reason,
    orderId,
    externalReferenceId,
    notes,
  },
  {
    apiVersion,
  } = {},
) => {

  const data = {
    point_adjustment_amount: pointAdjustmentAmount,
    ...(customerId && { customer_id: customerId }),
    ...(customerEmail && { customer_email: customerEmail }),
    ...(customerPhone && { phone_number: customerPhone }),
    ...(posAccountId && { pos_account_id: posAccountId }),
    ...(applyAdjustmentToPointsEarned !== undefined && { apply_adjustment_to_points_earned: applyAdjustmentToPointsEarned }),
    ...(reason && { reason }),
    ...(orderId && { order_id: orderId }),
    ...(externalReferenceId && { external_reference_id: externalReferenceId }),
    ...(notes && { notes }),
  };

  const response = await yotpoClient.fetch({
    url: `/points/adjust`,
    method: 'POST',
    data,
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
    adjustmentData,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'customerIdentifier', customerIdentifier, p => objHasAny(p, ['customerId', 'customerEmail', 'customerPhone', 'posAccountId'])),
    mandateParam(res, 'adjustmentData', adjustmentData, p => p.pointAdjustmentAmount !== undefined),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await yotpoCustomerPointsAdjust(
    credsPath,
    { ...customerIdentifier, ...adjustmentData },
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  yotpoCustomerPointsAdjust,
  yotpoCustomerPointsAdjustApi,
};

// curl localhost:8000/yotpoCustomerPointsAdjust -H "Content-Type: application/json" -d '{ "credsPath": "au", "customerIdentifier": { "customerEmail": "customer@example.com" }, "adjustmentData": { "pointAdjustmentAmount": 100, "applyAdjustmentToPointsEarned": true, "reason": "Reward customer" } }'