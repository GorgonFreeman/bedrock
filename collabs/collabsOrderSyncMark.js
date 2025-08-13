const { respond, mandateParam } = require('../utils');

const collabsOrderSyncMark = async (
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

const collabsOrderSyncMarkApi = async (req, res) => {
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

  const result = await collabsOrderSyncMark(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsOrderSyncMark,
  collabsOrderSyncMarkApi,
};

// curl localhost:8000/collabsOrderSyncMark -H "Content-Type: application/json" -d '{ "arg": "1234" }'