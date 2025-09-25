const { funcApi } = require('../utils');

const FUNC = async (
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

const FUNCApi = funcApi(FUNC, {
  argNames: ['arg'],
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "arg": "1234" }'