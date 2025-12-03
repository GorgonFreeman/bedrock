const { funcApi, objHasAny } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const FUNC = async (
  {
    // Add your parameters here
  },
  {
    credsPath,
  } = {},
) => {

  const driveClient = getGoogleDriveClient({ credsPath });

  // Your implementation here

  return {
    success: true,
    result: {},
  };
};

const FUNCApi = funcApi(FUNC, {
  argNames: ['arg', 'options'],
  validatorsByArg: {
    arg: p => objHasAny(p, []), // Add required fields
  },
});

module.exports = {
  FUNC,
  FUNCApi,
};

// curl localhost:8000/FUNC -H "Content-Type: application/json" -d '{ "arg": {} }'


