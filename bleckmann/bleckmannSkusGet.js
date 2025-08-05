const { respond, mandateParam } = require('../utils');
const { bleckmannGetter } = require('../bleckmann/bleckmann.utils');

const bleckmannSkusGet = async (
  {
    credsPath,
  } = {},
) => {

  return { 
    credsPath,
  };
  
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