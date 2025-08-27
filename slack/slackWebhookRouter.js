const { respond, logDeep } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack

  logDeep(req.body);

  const { 
    team_domain: teamDomain,
    command,
  } = req.body;
  const credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

  if (!credsPath) {
    return respond(res, 400, { error: `No creds path found for team domain` });
  }

  const interactivityFunc = require(`../slack/routed/${ command }`);
  return interactivityFunc(req, res);
};

module.exports = {
  slackWebhookRouterApi,
};