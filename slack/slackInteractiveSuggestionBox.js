const { respond, logDeep, customAxios } = require('../utils');

const { slackMessagePost } = require('../slack/slackMessagePost');

const ACTION_NAME = 'suggestion_box';
const SUGGESTIONS_BOX_SLACK_CHANNEL = '#suggestion_box';
const SUGGESTION_MIN_LENGTH = 10;

// Messages
const SUGGESTION_TEXTFIELD_PLACEHOLDER = 'Enter your suggestion here...';
const SUGGESTION_TEXTFIELD_LABEL = 'Your anonymous suggestion:';
const SUGGESTION_HEADER_TEXT = 'Suggestion Box';
const SUBMIT_BUTTON_TEXT = 'Submit Suggestion';
const CANCEL_BUTTON_TEXT = 'Cancel';
const EMPTY_SUGGESTION_MESSAGE = 'Is this a prank? You didn\'t enter anything! :face_holding_back_tears:';
const SUGGESTION_TOO_SHORT_MESSAGE = `Your suggestion is too short. :thinking_face: Please enter at least ${ SUGGESTION_MIN_LENGTH } characters.`;
const FAILED_TO_POST_SUGGESTION_MESSAGE = 'Failed to post suggestion to Slack.\nPlease let the dev team know asap so we can deliver your suggestions ASAP!';
const SUBMITTED_SUGGESTION_MESSAGE = 'Your suggestion has been submitted anonymously.\nThank you for your feedback! :wink:';
const CANCEL_MESSAGE = 'No worries - nothing was submitted.\n(You can always come back later to submit another suggestion!)';

// Blocks
const dividerBlock = {
  type: 'divider',
};

const headerBlock = {
  type: 'header',
  text: {
    type: 'plain_text',
    text: SUGGESTION_HEADER_TEXT,
  },
};

const suggestionInputBlock = {
  type: 'input',
  block_id: `suggestion_textfield`,
  element: {
    type: 'plain_text_input',
    multiline: true,
    placeholder: {
      type: 'plain_text',
      text: SUGGESTION_TEXTFIELD_PLACEHOLDER,
    },
  },
  label: {
    type: 'plain_text',
    text: SUGGESTION_TEXTFIELD_LABEL,
  }
};

const submitActionBlock = {
  type: 'actions',
  elements: [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: SUBMIT_BUTTON_TEXT,
      },
      value: 'submit',
      action_id: `${ ACTION_NAME }:submit`,
      style: 'primary',
    },
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: CANCEL_BUTTON_TEXT,
      },
      value: 'cancel',
      action_id: `${ ACTION_NAME }:cancel`,
    }
  ]
};

const initialBlocks = [
  headerBlock,
  dividerBlock,
  suggestionInputBlock,
  submitActionBlock,
];

const suggestionHeaderBlock = {
  type: 'header',
  text: {
    type: 'plain_text',
    text: 'New Suggestion',
  },
};

const suggestionSlackBlock = (suggestion) => {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: suggestion,
    },
  };
};

const suggestionReportBlocks = (suggestion) => {
  return [
    suggestionHeaderBlock,
    dividerBlock,
    suggestionSlackBlock(suggestion),
  ];
};

const slackInteractiveSuggestionBox = async (req, res) => {

  console.log('slackInteractiveSuggestionBox');

  const { body } = req;

  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    logDeep('initialBlocks', initialBlocks);

    return respond(res, 200, {
      response_type: 'ephemeral',
      blocks: initialBlocks,
    });
  }

  console.log(`Received payload - handling as interactive step`);

  respond(res, 200); // Acknowledgement - we'll provide the next step to the response_url later

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

  let response;

  let suggestion;

  switch (actionId) {
    case `${ ACTION_NAME }:submit`:

      suggestion = Object.values(state?.values?.suggestion_textfield || {})?.[0]?.value;
      suggestion = suggestion?.trim();

      if (!suggestion || suggestion === '') {
        response = {
          response_type: 'ephemeral',
          replace_original: 'true',
          text: EMPTY_SUGGESTION_MESSAGE,
        };
        break;
      }

      if (suggestion?.length < 10) {
        response = {
          response_type: 'ephemeral',
          replace_original: 'true',
          text: SUGGESTION_TOO_SHORT_MESSAGE,
        };
        break;
      }

      const slackMessagePostResult = await slackMessagePost({
        channelName: SUGGESTIONS_BOX_SLACK_CHANNEL,
      }, {
        blocks: suggestionReportBlocks(suggestion),
      });

      if (!slackMessagePostResult.success) {
        response = {
          response_type: 'ephemeral',
          replace_original: 'true',
          text: FAILED_TO_POST_SUGGESTION_MESSAGE,
        };
        break;
      }

      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: SUBMITTED_SUGGESTION_MESSAGE,
      };
      break;

    case `${ ACTION_NAME }:cancel`:

      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: CANCEL_MESSAGE,
      };
      break;

    default:
      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: `Errored: Unknown action: ${ actionId }`,
      };
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveSuggestionBox;