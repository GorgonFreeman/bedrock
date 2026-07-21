const { respond, logDeep, customAxios } = require('../utils');

// const { SLACK_CHANNELS_DEV } = require('../slack/slack.constants'); // Only available on another channel at the moment

const { slackCommandRestrictToChannels } = require('../slack/slack.utils');

const COMMAND_NAME = 'smart_collection_create'; // slash command
const ALLOWED_CHANNELS = [
  `foxtron_${ COMMAND_NAME }`,
  'foxtron_testing',
  // ...SLACK_CHANNELS_DEV,
];

const blocks = {

  initial: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Create a new smart collection*`,
    },
  },

  title_input: {
    type: 'input',
    label: {
      type: 'plain_text',
      text: 'Title',
    },
    element: {
      type: 'plain_text_input',
    },
  },

  description_input: {
    type: 'input',
    label: {
      type: 'plain_text',
      text: 'Description',
    },
    element: {
      type: 'plain_text_input',
      multiline: true,
    },
  },

  tag_input: {
    type: 'input',
    label: {
      type: 'plain_text',
      text: 'Tag',
    },
    element: {
      type: 'plain_text_input',
    },
  },

  buttons: {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Submit',
        },
        action_id: `${ COMMAND_NAME }:submit`,
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Cancel',
        },
        action_id: `${ COMMAND_NAME }:cancel`,
      },
    ],
  },

  error: (message) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Error:* ${ message }`,
      },
    };
  },

  result: (message) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${ message }`,
      },
    };
  },

}

const slackInteractiveShopifySmartCollectionCreate = async (req, res) => {
  console.log('slackInteractiveShopifySmartCollectionCreate');

  const { body } = req;

  if (!slackCommandRestrictToChannels(req, res, ALLOWED_CHANNELS)) {
    return;
  }
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    const initialBlocks = [
      blocks.initial,
      blocks.title_input,
      blocks.description_input,
      blocks.tag_input,
      blocks.buttons,
    ];

    logDeep('initialBlocks', initialBlocks);

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }

  // Because we got to this point, we have a payload - handle as an interactive step
  respond(res, 200); // Acknowledge immediately - we'll provide the next step to the response_url later

  const payload = JSON.parse(body.payload);
  logDeep('payload', payload);

  const { 
    response_url: responseUrl,
    state, 
    actions, 
  } = payload;

  const action = actions?.[0];
  const { 
    action_id: actionId,
    value: actionValue,
  } = action;

  logDeep({
    responseUrl,
    state,
    actionId,
    actionValue,
  });

  let response;

  response = {
    replace_original: 'true',
    text: `I don't do anything yet :hugging_face:`,
  };

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveShopifySmartCollectionCreate;