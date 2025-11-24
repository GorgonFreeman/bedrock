// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getPicktickets

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet, bleckmannGetter, bleckmannNowTime } = require('../bleckmann/bleckmann.utils');

const payloadMaker = (
  {
    credsPath,
    skip,
    perPage,

    createdFrom,
    createdTo,
    shippedFrom,
    shippedTo,
    // status default is INPROGRESS in the API, so to remove that unexpected default, we make it ANY unless provided
    status = 'ANY', // CREATED, INPROGRESS, PACKED, SHIPPED, CANCELLED, ANY
    reference,
    customerReference,

    ...getterOptions
  } = {},
) => {

  if (createdFrom && !createdTo) {
    createdTo = bleckmannNowTime();
  }

  return [
    'warehousing/picktickets',
    {
      credsPath,
      params: {
        ...(skip && { skip }),
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
        ...(shippedFrom && { shippedFrom }),
        ...(shippedTo && { shippedTo }),
        ...(status && { status }),
        ...(reference && { reference }),
        ...(customerReference && { customerReference }),
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  ];
};

const bleckmannPickticketsGet = async (...args) => {
  const response = await bleckmannGet(...payloadMaker(...args));
  return response;
};

const bleckmannPickticketsGetter = async (...args) => {
  const response = await bleckmannGetter(...payloadMaker(...args));
  return response;
};

const bleckmannPickticketsGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', 'arg'),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await bleckmannPickticketsGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannPickticketsGet,
  bleckmannPickticketsGetter,
  bleckmannPickticketsGetApi,
};

// curl localhost:8000/bleckmannPickticketsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 100 } }'