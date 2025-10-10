const { funcApi } = require('../utils');

const collabsCustomsDataSweep = async (
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

const collabsCustomsDataSweepApi = funcApi(collabsCustomsDataSweep, {
  argNames: ['arg', 'options'],
});

module.exports = {
  collabsCustomsDataSweep,
  collabsCustomsDataSweepApi,
};

// curl localhost:8000/collabsCustomsDataSweep -H "Content-Type: application/json" -d '{ "arg": "1234" }'