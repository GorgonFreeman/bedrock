const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannSkusGet = async (
  {
    credsPath,
  } = {},
) => {

  const response = await bleckmannGet(
    '/skus',
    {
      credsPath,
    },
  );
  logDeep(response);
  return response;
};

const bleckmannSkusGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await bleckmannSkusGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannSkusGet,
  bleckmannSkusGetApi,
};

// curl localhost:8000/bleckmannSkusGet