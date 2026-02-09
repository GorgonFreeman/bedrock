// https://developers.asana.com/reference/gettasks

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');

const asanaSectionsGet = async (
  {
    credsPath,

    offset,
    perPage,

    option,
  } = {},
) => {

  const params = {
    ...offset !== undefined && { offset },
    ...perPage !== undefined && { limit: perPage },
    ...option !== undefined && { option },
  };

  const response = await asanaGet('/things', {
    credsPath,
    params,
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaSectionsGetApi = funcApi(asanaSectionsGet, {
  argNames: ['options'],
  validatorsByArg: {
    // arg: Boolean,
  },
});

module.exports = {
  asanaSectionsGet,
  asanaSectionsGetApi,
};

// curl localhost:8000/asanaSectionsGet