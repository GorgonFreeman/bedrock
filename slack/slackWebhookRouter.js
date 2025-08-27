const { respond, logDeep } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');

const slashCommandToFunc = {
  '/test': require('../slack/slackInteractiveTest'),
};

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack

  logDeep(req.body);

  const { 
    team_domain: teamDomain,
    command,
  } = req.body;
  const credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];
  console.log(teamDomain, credsPath);

  if (credsPath === null) { // '' is a valid return for base path
    return respond(res, 400, { error: `No creds path found for team domain` });
  }

  const interactivityFunc = slashCommandToFunc[command];
  console.log('interactivityFunc', interactivityFunc);

  if (!interactivityFunc) {
    return respond(res, 400, { error: `No function found for command "${ command }"` });
  }

  return interactivityFunc(req, res);
};

module.exports = {
  slackWebhookRouterApi,
};