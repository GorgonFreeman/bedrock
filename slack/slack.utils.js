const { credsByPath, CustomAxiosClient, logDeep, askQuestion, Getter, getterAsGetFunction } = require('../utils');

const slackChannelNameToId = (channelName, { credsPath } = {}) => {
  // Remove hash from beginning of channel name if present
  channelName = channelName.replace(/^#/, '');
  const creds = credsByPath(['slack', credsPath]);
  const { CHANNEL_IDS } = creds;
  return CHANNEL_IDS[channelName];
};

const slackRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['slack', credsPath]);
  const { 
    BASE_URL,
    BOT_TOKEN,
  } = creds;

  const headers = {
    'Authorization': `Bearer ${ BOT_TOKEN }`,
  };

  return {
    baseUrl: BASE_URL,
    headers,
  };
};

const commonCreds = slackRequestSetup();
const { baseUrl } = commonCreds;

const slackClient = new CustomAxiosClient({
  baseUrl,
  preparer: slackRequestSetup,
  headers: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: (response) => {
    const { success, result } = response;
    if (!success) { // Return if failed
      return response;
    }

    const { ok, ...rest } = result;
    
    if (!ok) {
      return {
        success: false,
        error: [rest],
      };
    }

    return {
      success: true,
      result: rest,
    };
  },
});

const slackGetter = async (
  url,
  resultsNode,
  {
    credsPath,
    params,
    perPage, // Not supplying perPage results in Slack attempting to return the entire results - but we may get an error.
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params: {
          ...params,
          ...(perPage ? { limit: perPage } : {}),
        },
      },
      paginator: async (customAxiosPayload, response, additionalPaginationData) => {
        // logDeep(customAxiosPayload, response, additionalPaginationData);
        // await askQuestion('paginator?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return [true, null]; 
        }
        
        // 1. Extract necessary pagination info

        const { 
          response_metadata: responseMetadata,
        } = result;

        const {
          next_cursor: nextCursor,
        } = responseMetadata;

        // 2. Supplement payload with next pagination info

        const paginatedPayload = {
          ...customAxiosPayload,
          params: {
            ...customAxiosPayload?.params,
            cursor: nextCursor,
          },
        };
        
        // 3. Logic to determine done

        const done = !nextCursor;

        return [done, paginatedPayload];
      },
      digester: async (response) => {
        // logDeep(response);
        // await askQuestion('digester?');

        const { success, result } = response;
        if (!success) { // Return if failed
          return null; 
        }

        const items = result?.[resultsNode];
        return items;
      },
      client: slackClient,
      clientArgs: {
        context: {
          credsPath,
        },
      },

      ...getterOptions
    },
  );
};

const slackGet = getterAsGetFunction(slackGetter);

module.exports = {
  slackClient,
  slackGetter,
  slackGet,
  slackChannelNameToId,
};