const fs = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');
const { funcApi, objHasAny } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const googledriveFileUpload = async (
  {
    filePath,

    filePayload: {
      fileName,
      fileSource: {
        fileContent,
        fileBuffer,
      } = {},
    } = {},
  },
  {
    credsPath,

    mimeType = 'application/octet-stream',
    folderId,
  } = {},
) => {

  if (filePath) {
    fileName = path.basename(filePath);
    fileContent = await fs.readFile(filePath);
  }

  if (!(fileName && (fileContent || fileBuffer))) {
    return {
      success: false,
      error: ['Reconsider filePayload'],
    };
  }

  const driveClient = getGoogleDriveClient({ credsPath });

  let fileData = fileContent || fileBuffer;
  if (typeof fileData === 'string') {
    fileData = Buffer.from(fileData, 'utf8');
  }

  const requestPayload = {
    requestBody: {
      name: fileName,
      ...folderId && { parents: [folderId] },
    },
    media: { 
      body: Readable.from(fileData), 
      mimeType,
    },
  };
  
  try {
    const response = await driveClient.files.create(requestPayload);
    logDeep(response);
    return {
      success: true,
      result: response,
    };
  } catch (error) {
    return {
      success: false,
      error: [error],
    };
  }
};

const googledriveFileUploadApi = funcApi(googledriveFileUpload, {
  argNames: ['fileData', 'options'],
  validatorsByArg: {
    fileData: p => objHasAny(p, ['filePath', 'filePayload']),
  },
});

module.exports = {
  googledriveFileUpload,
  googledriveFileUploadApi,
};

// curl localhost:8000/googledriveFileUpload -H "Content-Type: application/json" -d '{ "fileData": { "filePath": "/.../_______.mp3" } }'