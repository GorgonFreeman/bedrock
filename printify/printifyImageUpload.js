const { respond, mandateParam, logDeep } = require('../utils');
const { printifyClient } = require('../printify/printify.utils');

const printifyImageUpload = async (
  imageUrl,
  filename,
  {
    credsPath,
  } = {},
) => {

  const data = {
    url: imageUrl,
    file_name: filename,
  };

  const response = await printifyClient.fetch({
    url: '/uploads/images.json',
    method: 'post',
    body: data,
    verbose: true,
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
  
};

const printifyImageUploadApi = async (req, res) => {
  const { 
    imageUrl,
    filename,
    options,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'imageUrl', imageUrl),
    mandateParam(res, 'filename', filename),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await printifyImageUpload(
    imageUrl,
    filename,
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  printifyImageUpload,
  printifyImageUploadApi,
};

// curl localhost:8000/printifyImageUpload -H "Content-Type: application/json" -d '{ "imageUrl": "...", "filename": "..." }'