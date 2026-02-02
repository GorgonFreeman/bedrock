const { funcApi } = require('../utils');

const collabsProductDataCheck = async (
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

const collabsProductDataCheckApi = funcApi(collabsProductDataCheck, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsProductDataCheck,
  collabsProductDataCheckApi,
};

// curl localhost:8000/collabsProductDataCheck -H "Content-Type: application/json" -d '{ "arg": "1234" }'