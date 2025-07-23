const { respond, mandateParam, logDeep, credsByPath } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyProductImagesDownload = async (
  productId,
  downloadPath,
  {
    credsPath,
    shopId,
  } = {},
) => {

  if (!shopId) {
    const { SHOP_ID } = credsByPath(['printify', credsPath]);
    shopId = SHOP_ID;
  }

  if (!shopId) {
    return {
      success: false,
      error: ['shopId is required'],
    };
  }

  return {
    success: false,
    error: ['WIP'],
  };
};

const printifyProductImagesDownloadApi = async (req, res) => {
  const { 
    productId,
    downloadPath,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'productId', productId),
    mandateParam(res, 'downloadPath', downloadPath),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyProductImagesDownload(
    productId,
    downloadPath,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyProductImagesDownload,
  printifyProductImagesDownloadApi,
};

// curl localhost:8000/printifyProductImagesDownload -H "Content-Type: application/json" -d '{ "arg": "1234" }'