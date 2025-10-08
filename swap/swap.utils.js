const {
  credsByPath,
  CustomAxiosClient,
  Getter,
  getterAsGetFunction,
} = require("../utils");

const swapRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(["swap", credsPath]);

  const {
    API_KEY,
    STORE_ID,
    BASE_URL,
  } = creds;

  if (!BASE_URL) {
    throw new Error("Swap BASE_URL is required");
  }

  return {
    baseUrl: BASE_URL,
    params: {
      api_token: API_KEY,
      store: STORE_ID,
    },
  };
};

const swapClient = new CustomAxiosClient({
  requiredContext: ["credsPath"],
  preparer: swapRequestSetup,
  baseHeaders: {
    "Content-Type": "application/json",
  },
});

const swapGetter = async (credsPath, url, nodeName, { params, ...getterOptions } = {}) => {
  return new Getter({
    url,
    payload: {
      params: {
        ...params,
      },
    },
    paginator: async (customAxiosPayload, response, additionalPaginationData) => {
      const { success, result } = response;
      if (!success) {
        return [true, null];
      }

      const { nextPageUrl } = result || {};

      const done = !nextPageUrl;

      return [
        done,
        customAxiosPayload,
        {
          url: nextPageUrl,
        },
      ];
    },
    digester: async (response) => {
      return response?.result?.[nodeName];
    },
    client: swapClient,
    clientArgs: {
      context: {
        credsPath,
        nodeName,
      },
    },
    ...getterOptions,
  });
};

const swapGet = getterAsGetFunction(swapGetter);

module.exports = {
  swapRequestSetup,
  swapClient,
  swapGetter,
  swapGet,
};
