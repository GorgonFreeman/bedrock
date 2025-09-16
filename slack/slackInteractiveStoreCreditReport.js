// https://docs.slack.dev/reference/methods/chat.delete

const { respond, logDeep, customAxios } = require('../utils');

const ACTION_NAME = 'store_credit_report';

const 

const slackInteractiveStoreCreditReport = async (req, res) => {
  console.log('slackInteractiveStoreCreditReport');
};

const slackInteractiveStoreCreditReportInitiator = async (credsPath, customer) => {
  console.log('slackInteractiveStoreCreditReportInitiator');
};

module.exports = {
  initiator: slackInteractiveStoreCreditReportInitiator,
  slackInteractiveStoreCreditReport,
};

// curl localhost:8000/slackInteractiveStoreCreditReport -H "Content-Type: application/json" -d '{ "channelId": "C06GAG30145", "timestamp": "1756218276.372199" }'