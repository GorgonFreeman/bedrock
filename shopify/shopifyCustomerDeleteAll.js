const { respond, mandateParam, logDeep, gidToId } = require('../utils');
const { shopifyClient } = require('../shopify/shopify.utils');

const { shopifyCustomerGet } = require('./shopifyCustomerGet');
const { shopifyCustomerDelete } = require('./shopifyCustomerDelete');
const { shopifyCustomerDataErasureRequest } = require('./shopifyCustomerDataErasureRequest');

const { REGIONS_WF } = require('../constants');

const shopifyCustomerDeleteAll = async (
  customerEmail,
  {
    apiVersion,
  } = {},
) => {

  let results = {};

  await Promise.all(REGIONS_WF.map(async (region) => {

    let result = {};

    const customer = await shopifyCustomerGet(region, { email: customerEmail }, { apiVersion });
    logDeep('customer', customer);
    const customerId = customer?.result?.id ? gidToId(customer.result.id) : null;
    if (!customerId) {
      return;
    }

    const deleteResult = await shopifyCustomerDelete(region, customerId, { apiVersion });
    result.deleteResult = deleteResult;

    const dataErasureResult = await shopifyCustomerDataErasureRequest(region, customerId, { apiVersion });
    result.dataErasureResult = dataErasureResult;

    results[region] = result;
  }));

  return results;
};

const shopifyCustomerDeleteAllApi = async (req, res) => {
  const {
    customerEmail,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'customerEmail', customerEmail),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyCustomerDeleteAll(
    customerEmail,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyCustomerDeleteAll,
  shopifyCustomerDeleteAllApi,
};

// curl localhost:8000/shopifyCustomerDeleteAll -H "Content-Type: application/json" -d '{ "customerEmail": "" }'