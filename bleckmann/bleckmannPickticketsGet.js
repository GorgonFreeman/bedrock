// https://app.swaggerhub.com/apis-docs/Bleckmann/warehousing/1.5.2#/PICKTICKET/getPicktickets

const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet, bleckmannNowTime } = require('../bleckmann/bleckmann.utils');

const bleckmannPickticketsGet = async (
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

  const response = await bleckmannGet(
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
  );
  logDeep(response);
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
  bleckmannPickticketsGetApi,
};

// curl localhost:8000/bleckmannPickticketsGet -H "Content-Type: application/json" -d '{ "options": { "limit": 100 } }'