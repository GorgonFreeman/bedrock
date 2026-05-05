const { funcApi, logDeep } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { shopifyDeliveryProfilesGet } = require('../shopify/shopifyDeliveryProfilesGet');

const shopifyShippingRatesDisabledReport = async (
  {
    regions = REGIONS_WF,
    apiVersion,
  } = {},
) => {

  // 1. Fetch all shipping rates from all regions

  // 2. Filter out the shipping rates that are disabled

  // 3. Report the disabled shipping rates to defined slack users/channels

  return {
    success: true,
    result: {},
  }
};

const shopifyShippingRatesDisabledReportApi = funcApi(shopifyShippingRatesDisabledReport, {
  argNames: ['credsPath', 'arg', 'options'],
});

module.exports = {
  shopifyShippingRatesDisabledReport,
  shopifyShippingRatesDisabledReportApi,
};

// curl localhost:8000/shopifyShippingRatesDisabledReport -H "Content-Type: application/json" -d '{ "credsPath": "au", "arg": "6979774283848" }'