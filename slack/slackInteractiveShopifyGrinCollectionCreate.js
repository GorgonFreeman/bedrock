const { respond, logDeep, customAxios, gidToId } = require('../utils');
const { REGIONS_WF } = require('../constants');
const { slackCommandRestrictToChannels } = require('../slack/slack.utils');
// const { SLACK_CHANNELS_DEV } = require('../slack/slack.constants'); // Only available on another channel at the moment

const { shopifyCollectionCreate } = require('../shopify/shopifyCollectionCreate');

const COMMAND_NAME = 'grin_collection_create'; // slash command
const ALLOWED_CHANNELS = [
  `foxtron_${ COMMAND_NAME }`,
  'foxtron_testing',
  // ...SLACK_CHANNELS_DEV,
];

// Tag format validator
// grin_region_title_month_year
const validateTagInput = (tag) => {
  if (!tag) {
    return;
  }

  const tagMatch = tag.match(/^([^_]+)_([^_]+)_(.+)_(.+)_(\d{4})$/);
  if (!tagMatch) {
    return;
  }

  const [, source, region, titleSlug, month, year] = tagMatch;

  if (source !== 'grin') {
    return;
  }

  if (!REGIONS_WF.includes(region)) {
    return;
  }

  if (!month || !year) {
    return;
  }

  if (!titleSlug) {
    return;
  }

  return {
    source,
    region,
    title: titleSlug.split('_').map(part => capitaliseString(part)).join(' '),
    titleSlug,
    month,
    year,
  }
}

const blocks = {

  initial: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Create a new smart collection*`,
    },
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
        placeholder: {
          type: 'plain_text',
          text: 'Enter tag in format (e.g. grin_au_new_arrivals_june_2026)',
        },
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

  const [commandName, actionName, ...actionNodes] = actionId.split(':');

  switch (actionName) {

    case 'submit':

      // Fetch the form input values from state
      const tag = state?.values?.tag_input?.[`${ COMMAND_NAME }:tag_input`]?.value?.trim();

      const tagValidation = validateTagInput(tag);

      // Validate the form input values and show an error message if any required fields are missing
      if (!tagValidation) {

        response = {
          replace_original: 'true',
          blocks: [
            blocks.initial,
            blocks.tag_input(tag),
            blocks.error('Invalid tag format. Please use the format: grin_region_title_month_year'),
            blocks.buttons,
          ],
        };
        break;
      }

      // Create the Shopify smart collection
      const collectionCreateResponse = await shopifyCollectionCreate(region, {
        title,
        descriptionHtml: description,
        ruleSet: {
          appliedDisjunctively: false,
          rules: [
            {
              column: 'TAG',
              relation: 'EQUALS',
              condition: tag,
            },
          ],
        },
        sortOrder: 'CREATED_DESC',
      });

      // Handle the Shopify smart collection creation response
      const { success: collectionCreateSuccess, result: collectionCreateResult } = collectionCreateResponse;

      // If the Shopify smart collection creation failed, show an error message on form
      if (!collectionCreateSuccess) {
        response = {
          replace_original: 'true',
          blocks: [
            blocks.initial,
            blocks.region_select(region),
            blocks.title_input(title),
            blocks.description_input(description),
            blocks.tag_input(tag),
            blocks.error(`Error creating collection: ${ collectionCreateResponse?.error?.[0]?.message }`),
            blocks.buttons,
          ],
        };
        
        break;
      }

      const {
        id: collectionId,
        title: collectionTitle,
      } = collectionCreateResult;
      
      // TODO: Use the shopify constants from the other branch
      // Map the region to the domain
      const domain = {
        au: 'white-fox-boutique-aus',
        us: 'white-fox-boutique-usa',
        uk: 'white-fox-boutique-uk',
      }[region];

      // Show the success message and the collection link
      response = {
        replace_original: 'true',
        blocks: [
          blocks.result(`Shopify smart collection created successfull!\n<${ `https://admin.shopify.com/store/${ domain }/collections/${ gidToId(collectionId) }` }|${ collectionTitle }>`),
        ],
      }

      break;

    case 'cancel':
      response = {
        delete_original: 'true',
      };
      break;

    default:
      console.warn(`Unknown actionName: ${ actionName }`);
      return;
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveShopifySmartCollectionCreate;