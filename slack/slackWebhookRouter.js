const { respond, logDeep } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack

  const { team_domain: teamDomain } = req.body;
  const credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

  if (!credsPath) {
    return respond(res, 400, { error: `No creds path found for team domain` });
  }

  logDeep(req.body);
  respond(res, 200, { ok: true });
};

module.exports = {
  slackWebhookRouterApi,
};