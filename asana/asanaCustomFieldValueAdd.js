const { funcApi } = require('../utils');

const asanaCustomFieldValueAdd = async (
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

const asanaCustomFieldValueAddApi = funcApi(asanaCustomFieldValueAdd, {
  argNames: ['arg', 'options'],
});

module.exports = {
  asanaCustomFieldValueAdd,
  asanaCustomFieldValueAddApi,
};

// curl localhost:8000/asanaCustomFieldValueAdd -H "Content-Type: application/json" -d '{ "arg": "1234" }'