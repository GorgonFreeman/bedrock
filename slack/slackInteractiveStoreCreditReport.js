// https://docs.slack.dev/reference/methods/chat.delete

const { funcApi, logDeep } = require('../utils');
const { slackClient } = require('../slack/slack.utils');

const slackInteractiveStoreCreditReport = async (req, res) => {
  console.log('slackInteractiveStoreCreditReport');
};

const slackInteractiveStoreCreditReportInitiator = async (req, res) => {
  console.log('slackInteractiveStoreCreditReportInitiator');
};

module.exports = {
  slackInteractiveStoreCreditReport,
  slackInteractiveStoreCreditReportApi,
};

// curl localhost:8000/slackInteractiveStoreCreditReport -H "Content-Type: application/json" -d '{ "channelId": "C06GAG30145", "timestamp": "1756218276.372199" }'