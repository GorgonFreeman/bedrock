const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { shopifyProductsGet } = require('../shopify/shopifyProductsGet');
const { REGIONS_WF } = require('../constants');

const shopifyDiscountClassTagsReport = async (
  {
    credsPaths = REGIONS_WF,
    apiVersion,
  } = {},
) => {

  const result = await Promise.all(credsPaths.map(async (credsPath) => {
    console.log(credsPath);
    const { DISCOUNT_CLASS_TAGS } = credsByPath(['shopify', credsPath]);
    console.log('creds', credsByPath(['shopify', credsPath]));

    if (!DISCOUNT_CLASS_TAGS) {
      throw new Error(`${ credsPath }: No discount class tags set`);
    }

    return await Promise.all(DISCOUNT_CLASS_TAGS.map(async (discountClassTag) => {
      const productsResponse = await shopifyProductsGet(
        credsPath,
        {
          apiVersion,
          queries: [
            `tag:${ discountClassTag }`,
            `published_status:published`,
          ],
        },
      );
      
      if (!productsResponse.success) {
        console.error(productsResponse);
        throw new Error(`${ credsPath }: Failed to get ${ discountClassTag } products`);
      }

      return {
        class: discountClassTag,
        count: productsResponse.result.length,
      };
    }));
  }));

  logDeep(result);
  return {
    success: true,
    result,
  };
};

const shopifyDiscountClassTagsReportApi = async (req, res) => {
  const { 
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'credsPaths', credsPaths),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await shopifyDiscountClassTagsReport(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyDiscountClassTagsReport,
  shopifyDiscountClassTagsReportApi,
};

// curl localhost:8000/shopifyDiscountClassTagsReport