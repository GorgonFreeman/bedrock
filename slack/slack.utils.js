const { credsByPath, CustomAxiosClient, logDeep, askQuestion, Getter, getterAsGetFunction, respond } = require('../utils');

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

const slackArrayToTableBlock = (array) => {
  // https://app.slack.com/block-kit-builder/TAK738ZT9#%7B%22blocks%22:%5B%7B%22type%22:%22table%22,%22rows%22:%5B%5B%7B%22type%22:%22rich_text%22,%22elements%22:%5B%7B%22type%22:%22rich_text_section%22,%22elements%22:%5B%7B%22type%22:%22text%22,%22text%22:%22Header%201%22,%22style%22:%7B%22bold%22:true%7D%7D%5D%7D%5D%7D,%7B%22type%22:%22rich_text%22,%22elements%22:%5B%7B%22type%22:%22rich_text_section%22,%22elements%22:%5B%7B%22type%22:%22text%22,%22text%22:%22Header%202%22,%22style%22:%7B%22bold%22:true%7D%7D%5D%7D%5D%7D%5D,%5B%7B%22type%22:%22rich_text%22,%22elements%22:%5B%7B%22type%22:%22rich_text_section%22,%22elements%22:%5B%7B%22type%22:%22text%22,%22text%22:%22Datum%201%22%7D%5D%7D%5D%7D,%7B%22type%22:%22rich_text%22,%22elements%22:%5B%7B%22type%22:%22rich_text_section%22,%22elements%22:%5B%7B%22type%22:%22text%22,%22text%22:%22Datum%202%22%7D%5D%7D%5D%7D%5D%5D%7D%5D%7D
  // TODO: Support items with varying props
  const headers = Object.keys(array?.[0]);
  return {
    type: 'table',
    rows: [
      ...headers.map(header => {
        return {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: header,
                  style: {
                    bold: true,
                  },
                },
              ],
            },
          ],
        };
      }),
      ...array.map(item => {
        return Object.values(item).map(v => {
          return {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: v,
                  },
                ],
              },
            ],
          };
        });
      }),
    ],
  };
};

const slackCommandRestrictToChannels = (
  req,
  res,
  allowedChannelNames, 
  {
    forbiddenMessage = `Hey, you can't use this command in this channel.`,
    informUserOfAllowedChannels = false,
  } = {},
) => {
  const { body } = req;
  const { channel_name: channelName } = body;

  if (allowedChannelNames.includes(channelName)) {
    return true;
  }

  respond(res, 200, {
    response_type: 'ephemeral',
    text: forbiddenMessage,
  });

  return false;
};

module.exports = {
  slackClient,
  slackGetter,
  slackGet,
  slackChannelNameToId,
  slackArrayToTableBlock,
  slackCommandRestrictToChannels,
};