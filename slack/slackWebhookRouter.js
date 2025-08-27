const { logDeep } = require('../utils');

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack
  logDeep(req.body);
};

module.exports = {
  slackWebhookRouterApi,
};