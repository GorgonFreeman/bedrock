const { respond, logDeep } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');

const slashCommandToFunc = {
  '/test': require('../slack/slackInteractiveTest'),
};

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack

  let credsPath;
  let slashCommand;

  const { body } = req;
  
  if (body?.payload) {

    console.log('Received payload - handling as interactivity step');

    const payload = JSON.parse(body.payload);
    logDeep('payload', payload);

    const { team } = payload;
    const { domain: teamDomain } = team;

    credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

    // TODO: Get slashCommand from action_id

  } else {

    console.log('No payload - handling as slash command');
    logDeep('body', body);

    const { 
      team_domain: teamDomain,
      command,
    } = body;

    credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

    slashCommand = command;

  }

  if (credsPath === null) { // '' is a valid return for base path
    return respond(res, 400, { error: `No creds path found for team domain` });
  }

  const interactivityFunc = slashCommandToFunc[slashCommand];
  console.log('interactivityFunc', interactivityFunc);

  if (!interactivityFunc) {
    return respond(res, 400, { error: `No function found for command "${ slashCommand }"` });
  }

  return interactivityFunc(req, res);
};

module.exports = {
  slackWebhookRouterApi,
};