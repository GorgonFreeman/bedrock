// https://docs.slack.dev/reference/methods/chat.delete

const { respond, logDeep, customAxios, credsByPath } = require('../utils');

const { slackMessagePost } = require('../slack/slackMessagePost');

const ACTION_NAME = 'store_credit_report';
const SLACK_CHANNEL_NAME = 'foxtron_testing';

const getAdminUrl = (credsPath) => {
  const shopifyCreds = credsByPath(['shopify', credsPath]);
  const { STORE_URL } = shopifyCreds;
  return `https://admin.shopify.com/store/${ STORE_URL }`;
}

const customerDetailsBlock = (credsPath, customer) => {
  const adminUrl = getAdminUrl(credsPath);
  const customerUrl = `${ adminUrl }/customers/${ customer.customerId }`;
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": `<${ customerUrl }|${ customer.customerDisplayName }> \n:credit_card: : ${ customer.calculatedCurrencyCode } ${ customer.calculatedAmount }`
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
    customerDetailsBlock(credsPath, customer),
    actionBlock(credsPath, customer),
  ]
};

const slackInteractiveStoreCreditReport = async (req, res) => {
  console.log('slackInteractiveStoreCreditReport');
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