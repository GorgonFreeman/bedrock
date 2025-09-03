const { respond, logDeep, customAxios } = require('../utils');

const { shopifyCustomerGet } = require('../shopify/shopifyCustomerGet');

const { REGIONS_WF } = require('../shopify/shopify.constants');

const ACTION_NAME = 'customer_delete';

const slackInteractiveShopifyCustomerDelete = async (req, res) => {

  console.log('slackInteractiveShopifyCustomerDelete');

  const { body } = req;

  // Generate initial blocks modularly
  const dividerBlock = {
    type: 'divider',
  };

  const headerBlock = {
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Customer Data Delete',
      emoji: true,
    },
  };

  const emailInputBlock = {
    type: 'input',
    block_id: `email_input_field`,
    element: {
      type: 'plain_text_input',
      action_id: `${ ACTION_NAME }:email_input`,
    },
    label: {
      type: 'plain_text',
      text: 'Customer email address:',
      emoji: true,
    },
  };

  const fetchActionBlock = {
    type: 'actions',
    elements: [
      {
        "type": "button",
        text: {
          type: 'plain_text',
          text: 'Cancel',
          emoji: true,
        },
        value: 'cancel',
        action_id: `${ ACTION_NAME }:cancel`,
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Find Customer',
          emoji: true,
        },
        value: 'fetch_customer',
        action_id: `${ ACTION_NAME }:fetch_customer`,
        style: 'primary',
      },
    ],
  };

  const deleteActionBlock = {
    type: 'actions',
    elements: [
      {
        "type": "button",
        text: {
          type: 'plain_text',
          text: 'Cancel',
          emoji: true,
        },
        value: 'cancel',
        action_id: `${ ACTION_NAME }:cancel`,
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Delete Customer',
          emoji: true,
        },
        value: 'delete_customer',
        action_id: `${ ACTION_NAME }:delete_customer`,
        style: 'danger',
        confirm: {
          title: {
            type: 'plain_text',
            text: 'Are you sure?',
          },
          text: {
            type: 'mrkdwn',
            text: 'This will delete the customer data from all Shopify stores',
          },
          confirm: {
            type: 'plain_text',
            text: 'Do it!',
          },
          deny: {
            type: 'plain_text',
            text: 'Nope, I\'ve changed my mind',
          },
        },
      },
    ],
  };

  const initialBlocks = [
    headerBlock,
    dividerBlock,
    emailInputBlock,
    fetchActionBlock,
  ];

  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    return respond(res, 200, {
      response_type: 'in_channel',
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

  switch (actionId) {
    case `${ ACTION_NAME }:fetch_customer`:
      
      const customerEmail = state?.values?.email_input_field[`${ ACTION_NAME }:email_input`]?.value;

      if (!customerEmail) {
        throw new Error('No email provided');
      }

      let regionalCustomer = {};

      await Promise.all(REGIONS_WF.map(async (region) => {
        const customer = await shopifyCustomerGet(region, {
          email: customerEmail,
        },
        {
          attrs: 'id displayName email phone createdAt'
        });
        if (customer && customer?.success && customer?.result) {
          regionalCustomer[region] = customer.result;
        }
      }));

      logDeep('regionalCustomer', regionalCustomer);

      if (Object.keys(regionalCustomer).length === 0) {
        response = {
          replace_original: 'true',
          text: `No customer found for email: ${ customerEmail }`,
        };
        break;
      }

      const customerCards = {
        type: 'section',
        fields: Object.entries(regionalCustomer).map(([region, customer]) => {
          return {
            type: 'mrkdwn',
            text: `*${ region.toUpperCase() }*: ${ customer.displayName }\n:email: ${ customer.email }\n:phone: ${ customer.phone }\nCreated: ${ customer.createdAt }\n`,
          };
        }),
      };

      const phase2Blocks = [
        headerBlock,
        dividerBlock,
        customerCards,
        deleteActionBlock,
      ]

      response = {
        replace_original: 'true',
        blocks: phase2Blocks,
      };

      break;
    case `${ ACTION_NAME }:cancel`:

      response = {
        replace_original: 'true',
        text: `No problem!`,
      };

      break;
    default:
      throw new Error(`Unknown action: ${ actionId }`);
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveShopifyCustomerDelete;