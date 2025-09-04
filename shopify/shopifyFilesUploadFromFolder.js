const { promises: fs } = require('fs');
const path = require('path');
const { funcApi, logDeep } = require('../utils');
const { shopifyFileUpload } = require('../shopify/shopifyFileUpload');

// Map file extensions to Shopify resource types
const getResourceType = (filename) => {
  const extension = path.extname(filename).toLowerCase();
  
  const resourceMapping = {
    '.jpg': 'IMAGE',
    '.jpeg': 'IMAGE',
    '.png': 'IMAGE',
    '.gif': 'IMAGE',
    '.webp': 'IMAGE',
    '.bmp': 'IMAGE',
    '.svg': 'IMAGE',
    '.mp4': 'VIDEO',
    '.mov': 'VIDEO',
    '.avi': 'VIDEO',
    '.wmv': 'VIDEO',
    '.flv': 'VIDEO',
    '.webm': 'VIDEO',
    '.pdf': 'FILE',
    '.csv': 'FILE',
    '.txt': 'FILE',
    '.doc': 'FILE',
    '.docx': 'FILE',
    '.xls': 'FILE',
    '.xlsx': 'FILE',
    '.zip': 'FILE',
    '.obj': 'MODEL_3D',
    '.fbx': 'MODEL_3D',
    '.glb': 'MODEL_3D',
    '.gltf': 'MODEL_3D',
    '.mp3': 'AUDIO',
    '.wav': 'AUDIO',
    '.aac': 'AUDIO',
    '.ogg': 'AUDIO',
  };
  
  return resourceMapping[extension] || 'FILE'; // Default to 'FILE' if no match
};

const shopifyFilesUploadFromFolder = async (
  regions,
  folderPath,
  {
    apiVersion,
  } = {},
) => {

  try {
    // Read all files from the folder
    const files = await fs.readdir(folderPath);
    logDeep('files', files);

    const results = [];

    // For each file in the folder
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      
      // Check if it's a file (not a directory)
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        continue;
      }

      // Determine resource type based on file extension
      const resource = getResourceType(file);
      logDeep('uploading file', { file, resource });

      // Upload to each store in regions
      for (const region of regions) {
        try {
          const uploadResult = await shopifyFileUpload(
            region,
            filePath,
            resource,
            {
              apiVersion,
            },
          );
          
          results.push({
            file,
            region,
            resource,
            success: uploadResult.success,
            result: uploadResult.result,
            error: uploadResult.error,
          });
          
          logDeep(`upload result for ${ file } to ${ region }`, uploadResult);
        } catch (error) {
          results.push({
            file,
            region,
            resource,
            success: false,
            error: error.message,
          });
          
          logDeep(`upload error for ${ file } to ${ region }`, error);
        }
      }
    }

    const response = {
      success: true,
      results,
    };

    logDeep(response);
    return response;
  } catch (error) {
    const response = {
      success: false,
      error: error.message,
    };
    
    logDeep(response);
    return response;
  }
};

const shopifyFilesUploadFromFolderApi = funcApi(shopifyFilesUploadFromFolder, {
  argNames: ['regions', 'folderPath', 'options'],
  validatorsByArg: {
    regions: Array.isArray,
    folderPath: Boolean,
  },
});

module.exports = {
  shopifyFilesUploadFromFolder,
  shopifyFilesUploadFromFolderApi,
};

// curl localhost:8000/shopifyFilesUploadFromFolder -H "Content-Type: application/json" -d '{ "regions": ["au"], "folderPath": "/Users/armstrong/Desktop/nanobots" }'