const { funcApi } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const googledriveFileGet = async (
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

const googledriveFileGetApi = funcApi(googledriveFileGet, {
  argNames: ['fileId', 'options'],
});

module.exports = {
  googledriveFileGet,
  googledriveFileGetApi,
};

// curl localhost:8000/googledriveFileGet -H "Content-Type: application/json" -d '{ "fileId": "11Dm4Hf9CBqDmAV933fe8voTUi_igdv8a" }'
