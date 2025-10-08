const { funcApi } = require('../utils');

const swapReturnsGet = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const swapReturnsGetApi = funcApi(swapReturnsGet, {
  argNames: ['arg'],
});

module.exports = {
  swapReturnsGet,
  swapReturnsGetApi,
};

// curl localhost:8000/swapReturnsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'