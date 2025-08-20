const { respond, mandateParam } = require('../utils');

const collabsFulfillmentsReview = async (
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

const collabsFulfillmentsReviewApi = async (req, res) => {
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

  const result = await collabsFulfillmentsReview(
    arg,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsFulfillmentsReview,
  collabsFulfillmentsReviewApi,
};

// curl localhost:8000/collabsFulfillmentsReview -H "Content-Type: application/json" -d '{ "arg": "1234" }'