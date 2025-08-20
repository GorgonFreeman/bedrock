const { respond, mandateParam } = require('../utils');

const collabsFulfillmentsReview = async (
  region,
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
    region,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'region', region),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await collabsFulfillmentsReview(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsFulfillmentsReview,
  collabsFulfillmentsReviewApi,
};

// curl localhost:8000/collabsFulfillmentsReview -H "Content-Type: application/json" -d '{ "region": "us" }'