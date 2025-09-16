// https://docs.slack.dev/reference/methods/chat.delete

const { respond, logDeep, customAxios, credsByPath, dateTimeFromNow, days } = require('../utils');
const { shopifyAdminUrlGet } = require('../shopify/shopify.utils');

const { slackMessagePost } = require('../slack/slackMessagePost');

const { shopifyTagsAdd } = require('../shopify/shopifyTagsAdd');

const ACTION_NAME = 'store_credit_report';
const SLACK_CHANNEL_NAME = 'foxtron_testing';

const EXEMPT_TAG = 'store_credit_exempt';
const EXEMPT_1_WEEK_TAG_PREFIX = 'store_credit_exempt_until:';
const EXEMPT_FOREVER_TAG = 'store_credit_exempt_forever';

const customerNameBlock = (credsPath, customer) => {
  const adminUrl = shopifyAdminUrlGet(credsPath);
  const customerUrl = `${ adminUrl }/customers/${ customer.customerId }`;
  return {
    "type": "section",
    "block_id": "customerNameBlock",
    "text": {
      "type": "mrkdwn",
      "text": `<${ customerUrl }|${ customer.customerDisplayName }>`
    }
  }
}

const customerStoreCreditBlock = (credsPath, customer) => {
  return {
    "type": "section",
    "block_id": "customerStoreCreditBlock",
    "text": {
      "type": "mrkdwn",
      "text": `:credit_card: on ${ credsPath.toUpperCase() } : ${ customer.calculatedCurrencyCode } ${ customer.calculatedAmount }`
    }
  }
}

const actionBlock = (credsPath, customer) => {
  return {
    "type": "actions",
    "elements": [
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Exempt 1 Week",
        },
        "value": `exempt_1_week:${ credsPath }:${ customer.customerId }`,
        "action_id": `${ ACTION_NAME }:exempt_1_week`
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Exempt Forever",
        },
        "value": `exempt_forever:${ credsPath }:${ customer.customerId }`,
        "action_id": `${ ACTION_NAME }:exempt_forever`
      },
      {
        "type": "button",
        "text": {
          "type": "plain_text",
          "text": "Dismiss",
        },
        "value": `dismiss:${ credsPath }:${ customer.customerId }`,
        "action_id": `${ ACTION_NAME }:dismiss`
      }
    ]
  }
}

const initialBlocks = (credsPath, customer) => {
  return [
    customerNameBlock(credsPath, customer),
    customerStoreCreditBlock(credsPath, customer),
    actionBlock(credsPath, customer),
  ]
};

const successBlock = (message) => {
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `${ message }`,
    }
  }
}

const errorBlock = (message) => {
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `:red_circle: ${ message }`,
    }
  }
}

const dismissedBlock = (message) => {
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `~${ message }~`,
    }
  }
}

const slackInteractiveStoreCreditReport = async (req, res) => {
  console.log('slackInteractiveStoreCreditReport');

  const { body } = req;

  respond(res, 200); // Acknowledgement - we'll provide the next step to the response_url later

  const payload = JSON.parse(body.payload);
  const { 
    response_url: responseUrl,
    state, 
    actions, 
  } = payload;

  const action = actions?.[0];
  logDeep('action', action);
  const { 
    action_id: actionId,
    value: actionValue,
  } = action;

  const currentBlocks = payload.message.blocks;
  const customerNameBlock = currentBlocks.find(block => block.block_id === 'customerNameBlock');
  const customerNameText = customerNameBlock.text.text;
  const customerStoreCreditBlock = currentBlocks.find(block => block.block_id === 'customerStoreCreditBlock');
  const customerStoreCreditText = customerStoreCreditBlock.text.text;
  const credsPath = actionValue.split(':')[1];
  const customerId = actionValue.split(':')[2];

  let response;

  switch (actionId) {
    case `${ ACTION_NAME }:exempt_1_week`:

      // TODO: Implement exempt_1_week
      const exemptUntil = dateTimeFromNow({ plus: days(7), dateOnly: true });
      const tagAddResponse = await shopifyTagsAdd(credsPath, [ `gid://shopify/Customer/${ customerId }` ], [EXEMPT_TAG, `${ EXEMPT_1_WEEK_TAG_PREFIX }${ exemptUntil }`]);
      if (!tagAddResponse.success) {
        response = {
          response_type: 'in_channel',
          replace_original: 'true',
          blocks: [
            errorBlock(`${ credsPath.toUpperCase() } | ${ customerNameText } | ${ customerStoreCreditText } | Error adding exempt tags`),
          ],
        }
        break;
      }

      response = {
        response_type: 'in_channel',
        replace_original: 'true',
        blocks: [
          successBlock(`${ credsPath.toUpperCase() } | ${ customerNameText } | ${ customerStoreCreditText } | Exempted for 1 week`),
        ],
      }
      break;
    case `${ ACTION_NAME }:exempt_forever`:

      const tagAddResponse2 = await shopifyTagsAdd(credsPath, [ `gid://shopify/Customer/${ customerId }` ], [EXEMPT_TAG, EXEMPT_FOREVER_TAG]);
      if (!tagAddResponse2.success) {
        response = {
          response_type: 'in_channel',
          replace_original: 'true',
          blocks: [
            errorBlock(`${ credsPath.toUpperCase() } | ${ customerNameText } | ${ customerStoreCreditText } | Error adding exempt tags`),
          ],
        }
        break;
      }

      response = {
        response_type: 'in_channel',
        replace_original: 'true',
        blocks: [
          successBlock(`${ credsPath.toUpperCase() } | ${ customerNameText } | ${ customerStoreCreditText } | Exempted forever`),
        ],
      }
      break;
    case `${ ACTION_NAME }:dismiss`:
      response = {
        response_type: 'in_channel',
        replace_original: 'true',
        blocks: [
          dismissedBlock(`${ credsPath.toUpperCase() } | ${ customerNameText } | ${ customerStoreCreditText } | Dismissed`),
        ],
      }
      break;
    default:
      response = {
        response_type: 'in_channel',
        replace_original: 'true',
        text: `${ credsPath.toUpperCase() } | ${ customerNameText } | ${ customerStoreCreditText } | Unknown action: ${ actionId }`,
      }
      break;
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

const slackInteractiveStoreCreditReportInitiator = async (credsPath, customer) => {
  const blocks = initialBlocks(credsPath, customer);
  logDeep('blocks', blocks);

  const initialSlackResult = await slackMessagePost({
    channelName: SLACK_CHANNEL_NAME,
  }, {
    blocks,
  });

  logDeep('initialSlackResult', initialSlackResult);
};

module.exports = {
  slackInteractiveStoreCreditReportInitiator,
  slackInteractiveStoreCreditReport,
};

// curl localhost:8000/slackInteractiveStoreCreditReport -H "Content-Type: application/json" -d '{ "channelId": "C06GAG30145", "timestamp": "1756218276.372199" }'