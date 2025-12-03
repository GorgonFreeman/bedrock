const { funcApi } = require('../utils');
const { driveFolderHandleToId } = require('../bedrock_unlisted/mappings');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

// TODO: Implement as getter pattern with pagination

const googledriveFilesGet = async (
  {
    credsPath,
    folderIdentifier: {
      folderHandle,
      folderId,
    } = {},
  } = {},
) => {

  if (folderHandle) {
    folderId = driveFolderHandleToId[folderHandle];
  }

  if (!folderId) {
    return {
      success: false,
      error: [`Couldn't get a folder ID from folderIdentifier`],
    };
  }

  const driveClient = getGoogleDriveClient({ credsPath });
  
  try {
    const clientResponse = await driveClient.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q: [
        'trashed=false',
        ...folderId && [`'${ folderId }' in parents`],
      ].join(' and '),
      pageSize: 100,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
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
  argNames: ['options'],
});

module.exports = {
  googledriveFilesGet,
  googledriveFilesGetApi,
};

// curl localhost:8000/googledriveFilesGet
// curl localhost:8000/googledriveFilesGet -H "Content-Type: application/json" -d '{ "options": { "folderIdentifier": { "folderHandle": "test" } } }'
