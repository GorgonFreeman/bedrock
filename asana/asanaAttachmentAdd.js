// https://developers.asana.com/reference/createattachmentforobject

const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const { asanaClient } = require('../asana/asana.utils');

const asanaAttachmentAdd = async (
  parentId,
  imgName,
  imgUrl,
  {
    credsPath,

    // params
    fields,
    pretty,
  } = {},
) => {

  const params = {
    ...(fields ? { opt_fields: fields } : {}),
    ...(pretty ? { opt_pretty: pretty } : {}),
  };

  const data = {
    resource_subtype: 'external',
    parent: parentId,
    name: imgName,
    url: imgUrl,
  };

  const response = await asanaClient.fetch({
    url: `/attachments`,
    method: 'post',
    params,
    body: {
      data,
    },
    context: {
      credsPath,
    },
  });
  
  !HOSTED && logDeep(response);
  return response;
};

const asanaAttachmentAddApi = funcApi(asanaAttachmentAdd, {
  argNames: ['parentId', 'imgName', 'imgUrl', 'options'],
});

module.exports = {
  asanaAttachmentAdd,
  asanaAttachmentAddApi,
};

// curl localhost:8000/asanaAttachmentAdd -H "Content-Type: application/json" -d '{ "parentId": "1214691486664407", "imgName": "Image", "imgUrl": "https://slack-files.com/TAK738ZT9-F0B307C7MD5-c1b520094c" }'