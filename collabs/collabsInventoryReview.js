const { respond, mandateParam } = require('../utils');

const collabsInventoryReview = async (
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

const collabsInventoryReviewApi = async (req, res) => {
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

  const result = await collabsInventoryReview(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsInventoryReview,
  collabsInventoryReviewApi,
};

// curl localhost:8000/collabsInventoryReview -H "Content-Type: application/json" -d '{ "arg": "1234" }'