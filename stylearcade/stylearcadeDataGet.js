const { funcApi, logDeep } = require('../utils');
const { stylearcadeGet, stylearcadeGetter } = require('./stylearcade.utils');

const payloadMaker = (
  {
    credsPath,
  } = {},
) => {
  return [
    {
      context: {
        credsPath,
      },
      resultsNode: 'records',
    },
  ];
};

const stylearcadeDataGet = async (...args) => {
  const response = await stylearcadeGet(...payloadMaker(...args));
  return response;
};

const stylearcadeDataGetter = async (...args) => {
  const response = await stylearcadeGetter(...payloadMaker(...args));
  return response;
};

const stylearcadeDataGetApi = funcApi(stylearcadeDataGet, {
  argNames: ['options'],
});

module.exports = {
  stylearcadeDataGet,
  stylearcadeDataGetter,
  stylearcadeDataGetApi,
};

// curl localhost:8000/stylearcadeDataGet