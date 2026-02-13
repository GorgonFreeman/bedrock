const { funcApi, logDeep, askQuestion } = require('../utils');

const { styleArcadeDataGetter } = require('../stylearcade/stylearcadeDataGet');

const stylearcadeProductGet = async (
  productIdentifier,
  {
    credsPath,
  } = {},
) => {

  console.warn(`Warning: this function works by paginating through all the products in Style Arcade and returning once it happens upon the one you want, so it's an expensive function.`);

  const getter = await styleArcadeDataGetter(
    {
      credsPath,
      onItems: async (items) => {
        logDeep(items);
        await askQuestion('?');
      },
    },
  );

  await getter.run();

  return {
    success: false,
    error: [`Fetched the whole Style Arcade catalogue and didn't find the product`],
  };
};

const stylearcadeProductGetApi = funcApi(stylearcadeProductGet, {
  argNames: ['productIdentifier', 'options'],
  validatorsByArg: {
    productIdentifier: p => objHasAny(p, ['productId']) || objHasAll(p, ['productHandle', 'productType']),
  },
});

module.exports = {
  stylearcadeProductGet,
  stylearcadeProductGetApi,
};

// curl localhost:8000/stylearcadeProductGet -H "Content-Type: application/json" -d '{ "productIdentifier": { ... } }'