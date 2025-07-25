const { respond, mandateParam, logDeep } = require('../utils');
const { shopifyPagesGet } = require('../shopify/shopifyPagesGet');

const shopifyPagesGetShogun = async (
  credsPath,
  {
    apiVersion,
  } = {},
) => {

  const pagesResponse = await shopifyPagesGet(credsPath, {
    apiVersion,
    attrs: `id title handle body`,
  });

  if (!pagesResponse?.success) {
    return pagesResponse;
  }

  const pages = pagesResponse?.result;

  const shogunPages = pages.filter(page => {
    const { body } = page;
    const bodyCompare = body.toLowerCase();
    return bodyCompare.includes('shogun') || bodyCompare.includes('shg-');
  });

  const response = {
    success: true,
    result: shogunPages,
    count: shogunPages.length,
  };

  logDeep(response);
  return response;
};

const shopifyPagesGetShogunApi = async (req, res) => {
  const { 
    credsPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await shopifyPagesGetShogun(
    credsPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  shopifyPagesGetShogun,
  shopifyPagesGetShogunApi,
};

// curl localhost:8000/shopifyPagesGetShogun -H "Content-Type: application/json" -d '{ "credsPath": "au" }'