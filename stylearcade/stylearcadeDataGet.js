const { funcApi, credsByPath, CustomAxiosClient, logDeep } = require('../utils');

const stylearcadeDataGet = async (
  {
    credsPath,
  } = {},
) => {

  const creds = credsByPath(['stylearcade', credsPath]);
  const { 
    BASE_URL, 
    API_KEY, 
  } = creds;

  const client = new CustomAxiosClient({
    baseUrl: BASE_URL,
    baseHeaders: {
      Authorization: `Bearer ${ API_KEY }`,
    },
  });

  const response = await client.fetch();
  logDeep(response);
  return response;
};

const stylearcadeDataGetApi = funcApi(stylearcadeDataGet, {
  argNames: ['options'],
});

module.exports = {
  stylearcadeDataGet,
  stylearcadeDataGetApi,
};

// curl localhost:8000/stylearcadeDataGet