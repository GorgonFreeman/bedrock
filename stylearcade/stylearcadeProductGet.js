const { funcApi } = require('../utils');

const stylearcadeProductGet = async (
  productIdentifier,
  {
    credsPath,
  } = {},
) => {

  console.warn(`Warning: this function works by paginating through all the products in Style Arcade and returning once it happens upon the one you want, so it's an expensive function.`);

  return { 
    productIdentifier, 
    credsPath,
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