const fs = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');

const { funcApi, objHasAny, objHasAll, logDeep } = require('../utils');
const { driveFolderHandleToId } = require('../bedrock_unlisted/mappings');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const googledriveFileUpload = async (

  // fileData
  {
    filePath,

    fileName,
    fileSource, // string or buffer
  },

  // folderIdentifier
  { 
    folderId, 
    folderHandle,
  } = {},

  {
    credsPath,
    mimeType = 'application/octet-stream',
  } = {},
) => {

  if (folderHandle) {
    folderId = driveFolderHandleToId[folderHandle];
  }

  if (!folderId) {
    return {
      success: false,
      error: ['Couldn\'t get a folder ID from folderIdentifier'],
    };
  }

  if (filePath) {
    fileName = path.basename(filePath);
    fileSource = await fs.readFile(filePath);
  }

  if (!(fileName && fileSource)) {
    return {
      success: false,
      error: ['Reconsider filePayload'],
    };
  }

  const driveClient = getGoogleDriveClient({ credsPath });

  const requestPayload = {
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      ...folderId && { parents: [folderId] },
    },
    media: { 
      body: Readable.from(fileSource), 
      mimeType,
    },
  };
  
  try {
    const clientResponse = await driveClient.files.create(requestPayload);
    logDeep('clientResponse', clientResponse);
    
    const fileId = clientResponse.data.id;
    const fileUrl = `https://drive.google.com/file/d/${ fileId }/view`;
    const folderUrl = folderId ? `https://drive.google.com/drive/folders/${ folderId }` : null;
    
    return {
      success: true,
      result: {
        ...clientResponse,
        customData: {
          fileUrl,
          ...folderUrl && { folderUrl },
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: [error],
    };
  }
};

const googledriveFileUploadApi = funcApi(googledriveFileUpload, {
  argNames: ['fileData', 'folderIdentifier', 'options'],
  validatorsByArg: {
    fileData: p => p?.filePath || objHasAll(p, ['fileName', 'fileSource']),
    folderIdentifier: p => objHasAny(p, ['folderId', 'folderHandle']),
  },
});

module.exports = {
  googledriveFileUpload,
  googledriveFileUploadApi,
};

// curl localhost:8000/googledriveFileUpload -H "Content-Type: application/json" -d '{ "fileData": { "filePath": "/.../.../________.mp3" }, "folderIdentifier": { "folderHandle": "test" } }'