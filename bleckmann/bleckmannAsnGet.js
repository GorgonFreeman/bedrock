// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/ASN/getAsnForId

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannClient } = require('../bleckmann/bleckmann.utils');

const bleckmannAsnGet = async (
  asnId,
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannClient.fetch({
    url: `/warehousing/asns/${ asnId }`,
  });

  logDeep(response);
  return response;
};

const bleckmannAsnGetApi = async (req, res) => {
  const { 
    asnId,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'asnId', asnId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await bleckmannAsnGet(
    asnId,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannAsnGet,
  bleckmannAsnGetApi,
};

// curl localhost:8000/bleckmannAsnGet -H "Content-Type: application/json" -d '{ "asnId": "UK-AG002594" }'