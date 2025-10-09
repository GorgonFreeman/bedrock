// https://api-docs.starshipit.com/#8cfbd1b2-bd08-4cec-966f-7104cc147aee
 
const { funcApi, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitProductAdd = async (
  credsPath,
  sku,
  {
    title,
    customsDescription,
    description,
    country,
    weight,
    height,
    length,
    width,
    hsCode,
    color,
    size,
    barcode,
    binLocation,
    brand,
    usage,
    material,
    model,
    mid,
    price,
    dangerousGoodsType,
  } = {},
) => {

  const response = await starshipitClient.fetch({
    url: '/products',
    method: 'post',
    body: {
      product: {
        sku,
        ...title && { title },
        ...customsDescription && { customs_description: customsDescription },
        ...description && { description },
        ...country && { country },
        ...weight && { weight },
        ...height && { height },
        ...length && { length },
        ...width && { width },
        ...hsCode && { hs_code: hsCode },
        ...color && { color },
        ...size && { size },
        ...barcode && { barcode },
        ...binLocation && { bin_location: binLocation },
        ...brand && { brand },
        ...usage && { usage },
        ...material && { material },
        ...model && { model },
        ...mid && { mid },
        ...price && { price },
        ...dangerousGoodsType && { dangerous_goods_type: dangerousGoodsType },
      },
    },
    context: {
      credsPath,
    },
    // interpreter: (response) => {
    //   return {
    //     ...response,
    //     ...response.result ? {
    //       result: response.result.arg_value,
    //     } : {},
    //   };
    // },
  });

  logDeep(response);
  return response;
};

const starshipitProductAddApi = funcApi(starshipitProductAdd, {
  argNames: ['credsPath', 'sku', 'options'],
});

module.exports = {
  starshipitProductAdd,
  starshipitProductAddApi,
};

// curl localhost:8000/starshipitProductAdd -H "Content-Type: application/json" -d '{ "credsPath": "wf", "arg": "408418809" }' 