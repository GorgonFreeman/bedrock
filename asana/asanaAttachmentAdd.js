// https://developers.asana.com/reference/gettasks

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaGet } = require('../asana/asana.utils');

const asanaAttachmentAdd = async (
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

const asanaAttachmentAddApi = funcApi(asanaAttachmentAdd, {
  argNames: ['options'],
  validatorsByArg: {
    // arg: Boolean,
  },
});

module.exports = {
  asanaAttachmentAdd,
  asanaAttachmentAddApi,
};

// curl localhost:8000/asanaAttachmentAdd