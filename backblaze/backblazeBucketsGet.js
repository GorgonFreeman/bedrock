const { respond, mandateParam } = require('../utils');

const backblazeBucketsGet = async (
  arg,
  {
    option,
  } = {},
) => {

  return { 
    arg, 
    option,
  };
  
};

const backblazeBucketsGetApi = async (req, res) => {
  const { 
    arg,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'arg', arg),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await backblazeBucketsGet(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  backblazeBucketsGet,
  backblazeBucketsGetApi,
};

// curl localhost:8000/backblazeBucketsGet -H "Content-Type: application/json" -d '{ "arg": "1234" }'