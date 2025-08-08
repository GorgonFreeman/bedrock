// https://developers.etsy.com/documentation/reference/#operation/deleteListingImage

const { respond, mandateParam, logDeep } = require('../utils');
const { etsyClient, etsyGetShopIdAndUserId } = require('../etsy/etsy.utils');

const etsyListingImageDelete = async (
  listingId,
  imageId,
  {
    credsPath,
    shopId,
  } = {},
) => {
  
  if (!shopId) {
    ({ shopId } = await etsyGetShopIdAndUserId({ credsPath, shopIdOnly: true }));
  }

  if (!shopId) {
    return {
      success: false,
      error: ['Shop ID not provided'],
    };
  }

  const response = await etsyClient.fetch({ 
    url: `/application/shops/${ shopId }/listings/${ listingId }/images/${ imageId }`,
    method: 'delete',
    context: {
      credsPath,
      withBearer: true,
    },
  });
  logDeep(response);
  return response;
};

const etsyListingImageDeleteApi = async (req, res) => {
  const { 
    listingId,
    imageId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'listingId', listingId),
    mandateParam(res, 'imageId', imageId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await etsyListingImageDelete(
    listingId,
    imageId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  etsyListingImageDelete,
  etsyListingImageDeleteApi,
};

// curl localhost:8000/etsyListingImageDelete -H "Content-Type: application/json" -d '{ "listingId": "123456", "imageId": "123456" }' 