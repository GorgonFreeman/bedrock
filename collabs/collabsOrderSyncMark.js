const { respond, mandateParam } = require('../utils');
const {
  REGIONS_PVX,
  REGIONS_BLUEYONDER,
  REGIONS_LOGIWA,
} = require('../constants');


const collabsOrderSyncMark = async (
  region,
  {
    option,
  } = {},
) => {

  

  return { 
    region, 
    option,
  };
  
};

const collabsOrderSyncMarkApi = async (req, res) => {
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

  const result = await collabsOrderSyncMark(
    region,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  collabsOrderSyncMark,
  collabsOrderSyncMarkApi,
};

// curl localhost:8000/collabsOrderSyncMark -H "Content-Type: application/json" -d '{ "region": "us" }'