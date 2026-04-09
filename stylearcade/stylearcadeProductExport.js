const { funcApi } = require('../utils');

const stylearcadeProductExport = async (
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

const stylearcadeProductExportApi = funcApi(stylearcadeProductExport, {
  argNames: ['arg', 'options'],
});

module.exports = {
  stylearcadeProductExport,
  stylearcadeProductExportApi,
};

// curl localhost:8000/stylearcadeProductExport -H "Content-Type: application/json" -d '{ "arg": "1234" }'