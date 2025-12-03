const { funcApi } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const defaultAttrs = `id, name, mimeType, size, createdTime, modifiedTime, webViewLink`;

const googledriveFileGet = async (
  fileId,
  {
    credsPath,
    attrs = defaultAttrs,
  } = {},
) => {

  const driveClient = getGoogleDriveClient({ credsPath });
  
  try {
    const clientResponse = await driveClient.files.get({
      supportsAllDrives: true,
      fileId,
      fields: attrs,
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

// curl localhost:8000/googledriveFileGet -H "Content-Type: application/json" -d '{ "fileId": "1YWzBt28D9ikWpreifWwo-2xdOQ4FATcA" }'
