// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/RETURN/getReturnForId

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannReturnGet = async (
  returnId,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/returns/${ encodeURIComponent(returnId) }`,
  });

  logDeep(response);
  return response;
};

const bleckmannReturnGetApi = async (req, res) => {
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

  const result = await bleckmannReturnGet(
    returnId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannReturnGet,
  bleckmannReturnGetApi,
};

// curl localhost:8000/bleckmannReturnGet -H "Content-Type: application/json" -d '{ "returnId": "979-D3-3862439" }'