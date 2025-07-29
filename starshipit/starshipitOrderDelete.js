const { respond, mandateParam, logDeep } = require('../utils');
const { starshipitClient } = require('../starshipit/starshipit.utils');

const starshipitOrderDelete = async (
  credsPath,
  orderId,
) => {

  const response = await starshipitClient.fetch({
    url: '/orders/delete',
    method: 'delete',
    params: {
      order_id: orderId,
    },
    factoryArgs: [{ credsPath }],
  });

  logDeep(response);
  return response;
};

const starshipitOrderDeleteApi = async (req, res) => {
  const { 
    credsPath,
    orderId,
  } = req.body;

  const paramsValid = await Promise.all([
    mandateParam(res, 'credsPath', credsPath),
    mandateParam(res, 'orderId', orderId),
  ]);
  if (paramsValid.some(valid => valid === false)) {
    return;
  }

  const result = await starshipitOrderDelete(
    credsPath,
    orderId,
  );
  respond(res, 200, result);
};

module.exports = {
  starshipitOrderDelete,
  starshipitOrderDeleteApi,
};

// curl localhost:8000/starshipitOrderDelete -H "Content-Type: application/json" -d '{ "credsPath": "wf", "orderId": "408418809" }' 