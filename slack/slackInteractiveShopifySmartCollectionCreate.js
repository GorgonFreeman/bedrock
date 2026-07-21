const { respond, logDeep, customAxios } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { slackCommandRestrictToChannels } = require('../slack/slack.utils');
// const { SLACK_CHANNELS_DEV } = require('../slack/slack.constants'); // Only available on another channel at the moment

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

  region_select: (initialValue = '') => {
    return {
      type: 'input',
      block_id: 'region_select',
      label: {
        type: 'plain_text',
        text: 'Region (required)',
      },
      element: {
        type: 'static_select',
        action_id: `${ COMMAND_NAME }:region_select`,
        options: REGIONS_WF.map(region => ({
          text: {
            type: 'plain_text',
            text: region.toUpperCase(),
          },
          value: region,
        })),
        ...initialValue ? { initial_option: {
          text: {
            type: 'plain_text',
            text: initialValue.toUpperCase(),
          },
          value: initialValue,
        } } : {},
      },
    };
  },

  title_input: (initialValue = '') => {
    return {
      type: 'input',
      block_id: 'title_input',
      label: {
        type: 'plain_text',
        text: 'Title (required)',
      },
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:title_input`,
        initial_value: initialValue,
      },
    };
  },

  description_input: (initialValue = '') => {
    return {
      type: 'input',
      block_id: 'description_input',
      label: {
        type: 'plain_text',
        text: 'Description',
      },
      element: {
        type: 'plain_text_input',
        multiline: true,
        action_id: `${ COMMAND_NAME }:description_input`,
        initial_value: initialValue,
      },
    };
  },

  tag_input: (initialValue = '') => {
    return {
      type: 'input',
      block_id: 'tag_input',
      label: {
        type: 'plain_text',
        text: 'Tag (required)',
      },
      element: {
        type: 'plain_text_input',
        action_id: `${ COMMAND_NAME }:tag_input`,
        initial_value: initialValue,
      },
    };
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
  
  // If no payload, this is an initiation, e.g. slash command - send the initial blocks
  if (!body?.payload) {

    if (!slackCommandRestrictToChannels(req, res, ALLOWED_CHANNELS)) {
      return;
    }

    const initialBlocks = [
      blocks.initial,
      blocks.region_select(),
      blocks.title_input(),
      blocks.description_input(),
      blocks.tag_input(),
      blocks.buttons,
    ];

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