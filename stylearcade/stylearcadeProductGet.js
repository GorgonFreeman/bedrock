const { funcApi, logDeep, askQuestion, objHasAny } = require('../utils');

const { stylearcadeDataGetter } = require('../stylearcade/stylearcadeDataGet');

const stylearcadeProductGet = async (
  {
    skuTrunk, // e.g. ABC123-5 (sku without size)
    productName,
  },
  {
    credsPath,
  } = {},
) => {

  if (!skuTrunk && !productName) {
    return {
      success: false,
      error: [`You must provide a product identifier`],
    };
  }

  console.warn(`Warning: this function works by paginating through all the products in Style Arcade and returning once it happens upon the one you want, so it's an expensive function.`);

  let foundResult;
  const getter = await stylearcadeDataGetter(
    {
      credsPath,
      onItems: async (items) => {
        for (const item of items) {
          const { data: itemData } = item;

          if (!itemData) {
            continue;
          }

          const {
            productId,
            name,
          } = itemData;

          if (
            (skuTrunk && productId === skuTrunk)
            || (productName && name === productName)
          ) {
            foundResult = { success: true, result: itemData };
            getter.end();
            return;
          }
        }
      },
    },
  );

  await getter.run();

  if (foundResult) {
    logDeep({ foundResult });
    return foundResult;
  }

  return {
    success: false,
    error: [`Didn't find the product`],
  };
};

const stylearcadeProductGetApi = funcApi(stylearcadeProductGet, {
  argNames: ['productIdentifier', 'options'],
  validatorsByArg: {
    productIdentifier: p => objHasAny(p, ['skuTrunk', 'productName']),
  },
});

module.exports = {
  stylearcadeProductGet,
  stylearcadeProductGetApi,
};

// curl localhost:8000/stylearcadeProductGet -H "Content-Type: application/json" -d '{ "productIdentifier": { "skuTrunk": "WFCAR58-1" } }'