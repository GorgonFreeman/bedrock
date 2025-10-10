const { funcApi } = require('../utils');

const stylearcadeDataGet = async (
  {
    credsPath,
  } = {},
) => {

  return true;

};

const stylearcadeDataGetApi = funcApi(stylearcadeDataGet, {
  argNames: ['options'],
});

module.exports = {
  stylearcadeDataGet,
  stylearcadeDataGetApi,
};

// curl localhost:8000/stylearcadeDataGet