const { respond, logDeep, customAxios, capitaliseString } = require('../utils');

const { slackMessagePost } = require('../slack/slackMessagePost');

const ACTION_NAME = 'suggestion_box';
const SUGGESTIONS_BOX_SLACK_CHANNEL = '#suggestion_box';
const SUGGESTION_MIN_LENGTH = 10;
const SUGGESTION_MAX_LENGTH = 500;

// Messages
const SUGGESTION_TEXTFIELD_PLACEHOLDER = `Enter your suggestion here (${ SUGGESTION_MIN_LENGTH }-${ SUGGESTION_MAX_LENGTH } characters)...`;
const SUGGESTION_HEADER_TEXT = 'Suggestion Box';
const ANONYMOUS_CHECKBOX_LABEL = 'I would like to be anonymous';
const SUBMIT_BUTTON_TEXT = 'Submit Suggestion';
const CANCEL_BUTTON_TEXT = 'Cancel';

const MESSAGE_EMPTY_SUGGESTION = 'Is this a prank? You didn\'t enter anything! :face_holding_back_tears:';
const MESSAGE_SUGGESTION_TOO_SHORT = `Your suggestion is too short. :thinking_face: Please enter at least ${ SUGGESTION_MIN_LENGTH } characters.`;
const MESSAGE_FAILED_TO_POST_SUGGESTION = 'Failed to post suggestion to Slack.\nPlease let the dev team know asap so we can deliver your suggestions ASAP!';
const MESSAGE_SUBMITTED_SUGGESTION = ':inbox_tray: Your suggestion has been submitted.\nThank you for your feedback! :wink:';
const MESSAGE_SUBMITTED_SUGGESTION_ANONYMOUS = ':inbox_tray: Your suggestion has been submitted anonymously.\nThank you for your feedback! :wink:';
const MESSAGE_CANCEL = 'No worries - nothing was submitted.\n(You can always come back later to submit another suggestion!)';
const MESSAGE_ANONYMOUS_SUGGESTION = 'New Anonymous Suggestion';
const MESSAGE_NON_ANONYMOUS_SUGGESTION = 'New Suggestion from [name]';

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

const suggestionInputBlock = ({ initialValue, focusOnLoad = false } = {}) => {
  return {
    type: 'input',
    block_id: `suggestion_textfield`,
    element: {
      type: 'plain_text_input',
      multiline: true,
      min_length: SUGGESTION_MIN_LENGTH,
      max_length: SUGGESTION_MAX_LENGTH,
      focus_on_load: focusOnLoad,
      ...initialValue ? { initial_value: initialValue } : {},
      placeholder: {
        type: 'plain_text',
        text: SUGGESTION_TEXTFIELD_PLACEHOLDER,
      },
    },
    label: {
      type: 'plain_text',
      text: ' ',
    }
  };
};

const anonymousCheckboxBlock = ({ anonymous = false } = {}) => {
  const checkBoxOptions = [
    {
      text: {
        type: 'plain_text',
        text: ANONYMOUS_CHECKBOX_LABEL,
      },
      value: `anonymous`
    }
  ];
  return {
    type: 'input',
    block_id: `anonymous_checkbox`,
    element: {
      type: "checkboxes",
      options: checkBoxOptions,
      ...anonymous ? { initial_options: checkBoxOptions } : {},
    },
    "label": {
      type: 'plain_text',
      text: ' ',
    }
  };
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

const initialBlocks = ({ initialValue, anonymous = false } = {}) => {
  return [
    headerBlock,
    dividerBlock,
    suggestionInputBlock({ initialValue }),
    anonymousCheckboxBlock({ anonymous }),
    submitActionBlock,
  ];
};

const errorBlock = (errorMessage) => {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:warning: ${ errorMessage }`,
    },
  }
};

const erroredBlocks = (errorMessage, { initialValue, anonymous = false } = {}) => {
  return [
    headerBlock,
    dividerBlock,
    suggestionInputBlock({ initialValue, focusOnLoad: true }),
    anonymousCheckboxBlock({ anonymous }),
    errorBlock(errorMessage),
    submitActionBlock,
  ];
};

const suggestionHeaderBlock = ({ isAnonymous, username } = {}) => {
  return {
    type: 'header',
    text: {
    type: 'plain_text',
      text: `${ isAnonymous ? MESSAGE_ANONYMOUS_SUGGESTION : `${ MESSAGE_NON_ANONYMOUS_SUGGESTION.replaceAll('[name]', capitaliseString(username)) }` }`,
    },
  };
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

const suggestionReportBlocks = (suggestion, { isAnonymous, username } = {}) => {
  return [
    suggestionHeaderBlock({ isAnonymous, username }),
    suggestionSlackBlock(suggestion),
    dividerBlock,
  ];
};

const slackInteractiveSuggestionBox = async (req, res) => {

  console.log('slackInteractiveSuggestionBox');

  const { body } = req;
  const { text: commandText } = body;

  if (commandText) {
    console.log(`Full slack command with command text > /${ ACTION_NAME } ${ commandText }`);

    const {
      response_url: responseUrl,
      user_name: username,
    } = body;

    const slackCommandMessagePostResult = await slackMessagePost({
      channelName: SUGGESTIONS_BOX_SLACK_CHANNEL,
    }, {
      blocks: suggestionReportBlocks(commandText, { isAnonymous: false, username }),
    });

    if (!slackCommandMessagePostResult.success) {
      return respond(res, 200, {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: MESSAGE_FAILED_TO_POST_SUGGESTION,
      });
    }

    return respond(res, 200, {
      response_type: 'ephemeral',
      replace_original: 'true',
      text: MESSAGE_SUBMITTED_SUGGESTION,
    });
  }

  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    return respond(res, 200, {
      response_type: 'ephemeral',
      blocks: initialBlocks(),
    });
  }

  console.log(`Received payload - handling as interactive step`);

  respond(res, 200); // Acknowledgement - we'll provide the next step to the response_url later

  const payload = JSON.parse(body.payload);
  // logDeep('payload', payload);

  const { 
    response_url: responseUrl,
    state, 
    actions,
    user,
  } = payload;
  
  const action = actions?.[0];
  const {
    action_id: actionId,
    value: actionValue,
  } = action;

  const {
    username,
  } = user;

  let response;

  let suggestion;
  let isAnonymous;

  switch (actionId) {
    case `${ ACTION_NAME }:submit`:

      suggestion = Object.values(state?.values?.suggestion_textfield || {})?.[0]?.value;
      suggestion = suggestion?.trim();

      // Check if user wants to be anonymous
      isAnonymous = Object.values(state?.values?.anonymous_checkbox || {})?.[0]?.selected_options?.some(
        option => option.value === 'anonymous'
      ) || false;

      if (!suggestion || suggestion === '') {
        response = {
          response_type: 'ephemeral',
          replace_original: 'true',
          blocks: erroredBlocks(MESSAGE_EMPTY_SUGGESTION, { anonymous: isAnonymous }),
        };
        break;
      }

      if (suggestion?.length < 10) {
        response = {
          response_type: 'ephemeral',
          replace_original: 'true',
          blocks: erroredBlocks(MESSAGE_SUGGESTION_TOO_SHORT, { initialValue: suggestion, anonymous: isAnonymous }),
        };
        break;
      }

      // TODO: Anonymous checkbox gets deselected when errored for two times since state on the checkbox is lost on the second error

      logDeep(`New suggestion from ${ username } | Anonymous ${ isAnonymous } | Suggestion: ${ suggestion }`);

      const slackMessagePostResult = await slackMessagePost({
        channelName: SUGGESTIONS_BOX_SLACK_CHANNEL,
      }, {
        blocks: suggestionReportBlocks(suggestion, { isAnonymous, username }),
      });

      if (!slackMessagePostResult.success) {
        response = {
          response_type: 'ephemeral',
          replace_original: 'true',
          text: MESSAGE_FAILED_TO_POST_SUGGESTION,
        };
        break;
      }

      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: isAnonymous ? MESSAGE_SUBMITTED_SUGGESTION_ANONYMOUS : MESSAGE_SUBMITTED_SUGGESTION,
      };
      break;

    case `${ ACTION_NAME }:cancel`:

      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: MESSAGE_CANCEL,
      };
      break;

    default:
      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: `Errored: Unknown action: ${ actionId }`,
      };
  }

  // logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveSuggestionBox;