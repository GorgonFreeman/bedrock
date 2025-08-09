// https://developers.loopreturns.com/api/returns/get-return

const { respond, mandateParam, logDeep } = require('../utils');
const { loopGet } = require('../loop/loop.utils');

const loopReturnGet = async (
  returnId,
  {
    credsPath,
    ...getterOptions
  } = {},
) => {

  if (!returnId) {
    return {
      success: false,
      error: ['returnId is required'],
    };
  }

  const response = await loopGet(
    `/returns/${ returnId }`,
    {
      credsPath,
      ...getterOptions,
    },
  );
  
  logDeep(response);
  return response;
};

const loopReturnGetApi = async (req, res) => {
  const { 
    returnId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'returnId', returnId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await loopReturnGet(
    returnId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopReturnGet,
  loopReturnGetApi,
};

// curl localhost:8000/loopReturnGet -H "Content-Type: application/json" -d '{ "returnId": "1234" }'