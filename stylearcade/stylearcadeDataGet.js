const { funcApi, credsByPath, CustomAxiosClient, logDeep } = require('../utils');
const { stylearcadeGet } = require('./stylearcade.utils');

const stylearcadeDataGet = async (
  {
    credsPath,
  } = {},
) => {

  const response = await stylearcadeGet({
    context: {
      credsPath,
      resultsNode: 'records',
    },
  });
  logDeep(response);
  return response;
};

const stylearcadeDataGetApi = funcApi(stylearcadeDataGet, {
  argNames: ['options'],
});

module.exports = {
  stylearcadeDataGet,
  stylearcadeDataGetApi,
};

// curl localhost:8000/stylearcadeDataGet