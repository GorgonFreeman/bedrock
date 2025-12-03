const { funcApi } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const googledriveFilesGet = async (
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

const googledriveFilesGetApi = funcApi(googledriveFilesGet, {
  argNames: ['fileId', 'options'],
});

module.exports = {
  googledriveFilesGet,
  googledriveFilesGetApi,
};

// curl localhost:8000/googledriveFilesGet -H "Content-Type: application/json" -d '{ "fileId": "11Dm4Hf9CBqDmAV933fe8voTUi_igdv8a" }'
