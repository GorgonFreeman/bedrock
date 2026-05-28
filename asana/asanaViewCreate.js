const { funcApi } = require('../utils');

const asanaViewCreate = async (
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

const asanaViewCreateApi = funcApi(asanaViewCreate, {
  argNames: ['arg', 'options'],
});

module.exports = {
  asanaViewCreate,
  asanaViewCreateApi,
};

// curl localhost:8000/asanaViewCreate -H "Content-Type: application/json" -d '{ "arg": "1234" }'