const { funcApi, objHasAny } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const googledriveFileDelete = async (
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

const googledriveFileDeleteApi = funcApi(googledriveFileDelete, {
  argNames: ['arg', 'options'],
  validatorsByArg: {
    arg: p => objHasAny(p, []), // Add required fields
  },
});

module.exports = {
  googledriveFileDelete,
  googledriveFileDeleteApi,
};

// curl localhost:8000/googledriveFileDelete -H "Content-Type: application/json" -d '{ "arg": {} }'


