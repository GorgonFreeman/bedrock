const { funcApi } = require('../utils');

const stylearcadeProductGet = async (
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

const stylearcadeProductGetApi = funcApi(stylearcadeProductGet, {
  argNames: ['arg', 'options'],
});

module.exports = {
  stylearcadeProductGet,
  stylearcadeProductGetApi,
};

// curl localhost:8000/stylearcadeProductGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'