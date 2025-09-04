const { promises: fs } = require('fs');
const path = require('path');
const { funcApi, logDeep, arrayStandardResponse } = require('../utils');
const { shopifyFileUpload } = require('../shopify/shopifyFileUpload');

const { REGIONS_WF } = require('../constants');

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
  folderPath,
  {
    regions = REGIONS_WF,
    apiVersion,
  } = {},
) => {

  // Read all files from the folder
  const allItems = await fs.readdir(folderPath);
  
  // Filter out non-files (directories, symlinks, etc.) and system files
  const files = [];
  for (const item of allItems) {
    // Skip system files like .DS_Store
    if (item.startsWith('.')) {
      continue;
    }
    
    const itemPath = path.join(folderPath, item);
    const stats = await fs.stat(itemPath);
    if (stats.isFile()) {
      files.push(item);
    }
  }

  logDeep('files', files?.length);

  const responses = [];

  // For each file in the folder
  for (const file of files) {

    const filePath = path.join(folderPath, file);

    // Determine resource type based on file extension
    const resource = getResourceType(file);

    // Upload to each store in regions
    for (const region of regions) {
      const uploadResponse = await shopifyFileUpload(
        region,
        filePath,
        resource,
        {
          apiVersion,
        },
      );
      
      responses.push(uploadResponse);
      console.log(`${ responses.length }/${ files.length * regions.length }`);
    }
  }

  const response = arrayStandardResponse(responses);
  logDeep(response);
  return response;
};

const shopifyFilesUploadFromFolderApi = funcApi(shopifyFilesUploadFromFolder, {
  argNames: ['folderPath', 'options'],
  validatorsByArg: {
    folderPath: Boolean,
  },
});

module.exports = {
  shopifyFilesUploadFromFolder,
  shopifyFilesUploadFromFolderApi,
};

// curl localhost:8000/shopifyFilesUploadFromFolder -H "Content-Type: application/json" -d '{ "folderPath": "/Users/armstrong/Desktop/nanobots" }'