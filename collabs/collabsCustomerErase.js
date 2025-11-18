const { funcApi } = require('../utils');

const collabsCustomerErase = async (
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

const collabsCustomerEraseApi = funcApi(collabsCustomerErase, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsCustomerErase,
  collabsCustomerEraseApi,
};

// curl localhost:8000/collabsCustomerErase -H "Content-Type: application/json" -d '{ "arg": "1234" }'