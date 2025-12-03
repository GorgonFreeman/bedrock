const { funcApi, objHasAny } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const googledriveFileDelete = async (
  // TODO: Support file name as identifier
  fileId,
  {
    credsPath,
  } = {},
) => {

  const driveClient = getGoogleDriveClient({ credsPath });
  
  try {
    const clientResponse = await driveClient.files.delete({
      supportsAllDrives: true,
      fileId,
    });
    
    return {
      success: true,
      result: clientResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: [error],
    };
  }
};

const googledriveFileDeleteApi = funcApi(googledriveFileDelete, {
  argNames: ['fileId', 'options'],
});

module.exports = {
  googledriveFileDelete,
  googledriveFileDeleteApi,
};

// curl localhost:8000/googledriveFileDelete -H "Content-Type: application/json" -d '{ "fileId": "11Dm4Hf9CBqDmAV933fe8voTUi_igdv8a" }'
