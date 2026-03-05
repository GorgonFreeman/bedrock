const { funcApi } = require('../utils');

const bedrock_utilities_geoRedirect = async (
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

const bedrock_utilities_geoRedirectApi = funcApi(bedrock_utilities_geoRedirect, {
  argNames: ['arg', 'options'],
});

module.exports = {
  bedrock_utilities_geoRedirect,
  bedrock_utilities_geoRedirectApi,
};

// curl localhost:8000/bedrock_utilities_geoRedirect -H "Content-Type: application/json" -d '{ "arg": "1234" }'