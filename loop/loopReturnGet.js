// https://docs.loopreturns.com/api-reference/latest/return-data/get-return-details

const { respond, mandateParam, logDeep } = require('../utils');
const { loopClient } = require('../loop/loop.utils');

const loopReturnGet = async (
  credsPath,
  returnId,
) => {

  if (!returnId) {
    return {
      success: false,
      error: ['returnId is required'],
    };
  }

  const response = await loopClient.fetch({
    url: `/warehouse/return/details`,
    params: {
      return_id: returnId,
    },
    context: {
      credsPath,
    },
  });
  
  logDeep(response);
  return response;
};

const loopReturnGetApi = async (req, res) => {
  const { 
    credsPath,
    returnId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'returnId', returnId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await loopReturnGet(
    credsPath,
    returnId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  loopReturnGet,
  loopReturnGetApi,
};

// curl localhost:8000/loopReturnGet -H "Content-Type: application/json" -d '{ "credsPath": "au", "returnId": "85747906" }'