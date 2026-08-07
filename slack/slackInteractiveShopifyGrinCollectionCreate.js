const { respond, logDeep, customAxios, gidToId, askQuestion, capitaliseString } = require('../utils');
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

// TODO: Use the shopify constants from the other git branch
// Map the region to the Shopify admin store slug
const regionToShopifyDomain = {
  au: 'white-fox-boutique-aus',
  us: 'white-fox-boutique-usa',
  uk: 'white-fox-boutique-uk',
};

// Month names derived from Date (long + short), so we don't hardcode them
const VALID_MONTHS = new Set(
  Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return [
      date.toLocaleString('en-US', { month: 'long' }).toLowerCase(),
      date.toLocaleString('en-US', { month: 'short' }).toLowerCase(),
    ];
  }).flat(),
);

const isValidMonth = (month) => VALID_MONTHS.has(month?.toLowerCase());

// Tag format validator
// grin_region_title_month_year
const validateTagInput = (tag) => {
  if (!tag) {
    return {
      success: false,
      message: 'No tag provided - please enter a tag in the format: grin_region_title_month_year (e.g. grin_au_new_arrivals_june_2026)',
    };
  }

  const tagMatch = tag.match(/^([^_]+)_([^_]+)_(.+)_(.+)_(.+)$/);
  if (!tagMatch) {
    return {
      success: false,
      message: 'Invalid tag format - please use: grin_region_title_month_year (e.g. grin_au_new_arrivals_june_2026)',
    };
  }

  const [, source, region, titleSlug, month, year] = tagMatch;

  if (source !== 'grin') {
    return {
      success: false,
      message: `Tag must start with \`grin_\` - please use the format: grin_region_title_month_year (e.g. grin_au_new_arrivals_june_2026)`,
    };
  }

  if (!REGIONS_WF.includes(region)) {
    return {
      success: false,
      message: `Invalid region \`${ region }\` - must be one of: ${ REGIONS_WF.join(', ') }`,
    };
  }

  if (!titleSlug) {
    return {
      success: false,
      message: 'Missing title - include the title between region and month (e.g. grin_au_new_arrivals_june_2026)',
    };
  }

  if (!month) {
    return {
      success: false,
      message: 'Missing month - include a month before the year (e.g. grin_au_new_arrivals_june_2026)',
    };
  }

  if (!isValidMonth(month)) {
    return {
      success: false,
      message: `Invalid month \`${ month }\` - use a full or short month name (e.g. june or jun)`,
    };
  }

  if (!year) {
    return {
      success: false,
      message: 'Missing year - tag must end with a 4-digit year (e.g. grin_au_new_arrivals_june_2026)',
    };
  }

  if (!/^\d{4}$/.test(year)) {
    return {
      success: false,
      message: `Invalid year \`${ year }\` - must be a 4-digit year (e.g. 2026)`,
    };
  }

  return {
    success: true,
    source,
    region,
    title: titleSlug.split('_').map(part => capitaliseString(part)).join(' '),
    titleSlug,
    month: month.toLowerCase(),
    year,
  };
}

const blocks = {

  initial: {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Create a new GRIN smart collection*`,
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

  loading: (message) => {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_${ message }_`,
      },
    };
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

  result: (collectionCreateResults) => {

    const resultLines = Object.entries(collectionCreateResults).map(([region, result]) => {
      if (result.success) {
        const {
          collectionTitle,
          collectionTag,
          collectionAdminUrl,
        } = result;
        return `:white_check_mark: ${ region.toUpperCase() } <${ collectionAdminUrl }|${ collectionTitle }> => tag: \`${ collectionTag }\` `;
      }
      const {
        error,
      } = result;
      return `:x: ${ region.toUpperCase() } Error: ${ error }`;
    });

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Collection creation results*\n${ resultLines.join('\n') }`,
      },
    }
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
      if (!tagValidation.success) {

        response = {
          replace_original: 'true',
          blocks: [
            blocks.initial,
            blocks.tag_input(tag),
            blocks.error(tagValidation.message),
            blocks.buttons,
          ],
        };
        break;
      }

      // Show the loading message and wait for the Shopify smart collection creation response
      response = {
        replace_original: 'true',
        blocks: [
          blocks.loading('Creating collections...'),
        ],
      };

      await customAxios(responseUrl, {
        method: 'post',
        body: response,
      });

      const {
        source,
        // region, // We don't use this for tag creation, just for validation
        title,
        titleSlug,
        month,
        year,
      } = tagValidation;

      const collectionCreateResults = {};

      // Loop through each region and create the Shopify smart collection
      for (const region of REGIONS_WF) {

        const collectionTag = `${ source }_${ region }_${ titleSlug }_${ month }_${ year }`;
        const collectionTitle = `${ source.toUpperCase() } ${ title } ${ capitaliseString(month) } ${ year }`;

        // Create the Shopify smart collection
        const collectionCreateResponse = await shopifyCollectionCreate(region, {
          title: collectionTitle,
          ruleSet: {
            appliedDisjunctively: false,
            rules: [
              {
                column: 'TAG',
                relation: 'EQUALS',
                condition: collectionTag,
              },
            ],
          },
          sortOrder: 'CREATED_DESC',
        });

        // Handle the Shopify smart collection creation response
        const { success: collectionCreateSuccess, result: collectionCreateResult } = collectionCreateResponse;

        // If the Shopify smart collection creation failed, record the error and continue
        if (!collectionCreateSuccess) {
          collectionCreateResults[region] = {
            success: false,
            error: collectionCreateResponse?.error?.[0]?.message,
          };
          continue;
        }

        const {
          id: collectionId,
        } = collectionCreateResult;

        collectionCreateResults[region] = {
          success: true,
          collectionId,
          collectionTitle,
          collectionTag,
          collectionAdminUrl: `https://admin.shopify.com/store/${ regionToShopifyDomain[region] }/collections/${ gidToId(collectionId) }`,
        };
      }

      // Show the success message and the collection link
      response = {
        replace_original: 'true',
        blocks: [
          blocks.result(collectionCreateResults),
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