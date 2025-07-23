const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyOrderCreate = async (
  externalId,
  shippingMethod,
  addressTo,
  lineItems,
  {
    credsPath,
    label,
    expressShipping,
    economyShipping,
    sendShippingNotification = true,
  } = {},
) => {

  const { SHOP_ID } = credsByPath(['printify', credsPath]);

  const orderData = {
    external_id: externalId,
    shipping_method: shippingMethod,
    address_to: addressTo,
    line_items: lineItems,
    ...label ? { label } : {},
    ...expressShipping ? { is_express: expressShipping } : {},
    ...economyShipping ? { is_economy: economyShipping } : {},
    ...sendShippingNotification ? { send_shipping_notification: sendShippingNotification } : {},
  };

  const response = await printifyClient.fetch({
    url: `/shops/${ SHOP_ID }/orders.json`,
    method: 'post',
    body: orderData,
    verbose: true,
    credsPath,
  });

  logDeep(response);
  return response;
  
};

const printifyOrderCreateApi = async (req, res) => {
  const { 
    externalId,
    shippingMethod,
    addressTo,
    lineItems,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'externalId', externalId, p => typeof p === 'string'),
    mandateParam(res, 'shippingMethod', shippingMethod),
    mandateParam(res, 'addressTo', addressTo),
    mandateParam(res, 'lineItems', lineItems, p => Array.isArray(p) && p.every(i => ((i?.product_id && i?.variant_id) || i?.sku) && i?.quantity)),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyOrderCreate(
    externalId,
    shippingMethod,
    addressTo,
    lineItems,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyOrderCreate,
  printifyOrderCreateApi,
};

// curl localhost:8000/printifyOrderCreate -H "Content-Type: application/json" -d '{ "externalId": "1234", ... }'