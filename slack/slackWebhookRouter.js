const { respond, logDeep } = require('../utils');

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack
  logDeep(req.body);
  respond(res, 200, { ok: true });
};

module.exports = {
  slackWebhookRouterApi,
};