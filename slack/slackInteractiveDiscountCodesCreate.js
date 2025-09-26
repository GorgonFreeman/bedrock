const { respond, logDeep, customAxios } = require('../utils');

const ACTION_NAME = 'discount_codes_create';

const shopifyGetSingle = require('../shopify/shopifyGetSingle');

// Messages
const AU_DISCOUNT_URL_LABEL = 'AU Discount URL';
const AU_DISCOUNT_URL_PLACEHOLDER = 'https://whitefoxboutique.com.au/discount/....';
const FETCH_DISCOUNT_SETTINGS_BUTTON_TEXT = 'Fetch Discount Settings';
const CANCEL_BUTTON_TEXT = 'Cancel';

// Blocks
const dividerBlock = {
  type: 'divider',
};

const headerBlock = {
  type: 'header',
  text: {
    type: 'plain_text',
    text: 'Create Discount Code',
  },
};

const auDiscountUrlInputBlock = {
  type: 'input',
  block_id: 'discount_url_input',
  element: {
    type: 'plain_text_input',
    placeholder: {
      type: 'plain_text',
      text: AU_DISCOUNT_URL_PLACEHOLDER,
    },
  },
  label: {
    type: 'plain_text',
    text: AU_DISCOUNT_URL_LABEL,
  },
};

const discountSettingsFetchActionBlock = {
  type: 'actions',
  elements: [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: FETCH_DISCOUNT_SETTINGS_BUTTON_TEXT,
      },
      value: 'fetch_discount_settings',
      action_id: `${ ACTION_NAME }:fetch`,
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
    },
  ],
}

const fetchBlocks = [
  headerBlock,
  dividerBlock,
  auDiscountUrlInputBlock,
  discountSettingsFetchActionBlock,
];

const slackInteractiveDiscountCodesCreate = async (req, res) => {

  console.log('slackInteractiveDiscountCodesCreate');

  const { body } = req;

  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    logDeep('fetchBlocks', fetchBlocks);

    return respond(res, 200, {
      response_type: 'ephemeral',
      blocks: fetchBlocks,
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
  let auDiscountId;

  switch (actionId) {
    case `${ ACTION_NAME }:fetch`:

      const auDiscountUrl = Object.values(state?.values?.discount_url_input || {})?.[0]?.value;
      auDiscountId = auDiscountUrl?.split('?')?.shift()?.split('/')?.pop() || null;

      if (!auDiscountId) {
        response = {
          response_type: 'ephemeral',
          replace_original: 'true',
          text: `Invalid AU Discount URL`,
        };
        break;
      }

      const attrs = `id title code`;
      const discount = await shopifyGetSingle(
        'au',
        'discount',
        auDiscountId,
        {
          attrs,
        },
      )

      break;
      
    case `${ ACTION_NAME }:cancel`:
      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: `Cancelled`,
      };
      break;
    default:
      response = {
        response_type: 'ephemeral',
        replace_original: 'true',
        text: `Errored: Unknown action: ${ actionId }`,
      };
      break;
  }

  // logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveDiscountCodesCreate;