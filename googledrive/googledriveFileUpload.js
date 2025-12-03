const { funcApi, objHasAny } = require('../utils');
const { getGoogleDriveClient } = require('../googledrive/googledrive.utils');

const googledriveFileUpload = async (
  {
    fileName,
    fileContent,
    fileBuffer,
    mimeType,
    folderId,
    parentFolderId,
  },
  {
    credsPath,
  } = {},
) => {

  if (!fileName) {
    return {
      success: false,
      errors: ['fileName is required'],
    };
  }

  if (!fileContent && !fileBuffer) {
    return {
      success: false,
      errors: ['Either fileContent or fileBuffer is required'],
    };
  }

  const driveClient = getGoogleDriveClient({ credsPath });

  // Use parentFolderId if provided, otherwise use folderId for backward compatibility
  const parentId = parentFolderId || folderId;

  // Prepare file metadata
  const fileMetadata = {
    name: fileName,
  };

  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  // Handle file content
  // - fileBuffer: Buffer object or base64 string (will be decoded)
  // - fileContent: plain text string
  let fileBody;
  if (fileBuffer) {
    // If fileBuffer is a string, treat it as base64; otherwise use as Buffer
    if (typeof fileBuffer === 'string') {
      fileBody = Buffer.from(fileBuffer, 'base64');
    } else {
      fileBody = fileBuffer;
    }
  } else {
    // fileContent is treated as plain text
    fileBody = Buffer.from(fileContent);
  }

  // Prepare media
  const media = {
    mimeType: mimeType || 'application/octet-stream',
    body: fileBody,
  };

  try {
    const response = await driveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink, webContentLink',
    });

    return {
      success: true,
      result: response.data,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message || 'Failed to upload file to Google Drive'],
    };
  }
};

const googledriveFileUploadApi = funcApi(googledriveFileUpload, {
  argNames: ['fileData', 'options'],
  validatorsByArg: {
    fileData: p => objHasAny(p, ['fileName']),
  },
});

module.exports = {
  googledriveFileUpload,
  googledriveFileUploadApi,
};

// curl localhost:8000/googledriveFileUpload -H "Content-Type: application/json" -d '{ "fileData": { "fileName": "test.txt", "fileContent": "Hello World", "mimeType": "text/plain", "folderId": "your-folder-id" } }'
// curl localhost:8000/googledriveFileUpload -H "Content-Type: application/json" -d '{ "fileData": { "fileName": "image.png", "fileBuffer": "base64EncodedStringHere", "mimeType": "image/png", "parentFolderId": "your-folder-id" } }'

