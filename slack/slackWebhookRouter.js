const { respond, logDeep } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');

const actionNameToFunc = {
  'test': require('../slack/slackInteractiveTest'),
  'pizza': require('../slack/slackInteractiveTestMulti'),
  'discount_codes_create': require('../slack/slackInteractiveDiscountCodesCreate'),
};

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack

  let credsPath;
  let actionName;

  const { body } = req;
  
  if (body?.payload) {

    console.log('Received payload - handling as interactivity step');

    const payload = JSON.parse(body.payload);
    // logDeep('payload', payload);

    const { team } = payload;
    const { domain: teamDomain } = team;

    credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

    // TODO: Get actionName from action_id
    actionName = payload?.actions?.[0]?.action_id?.split(':')?.[0];

  } else {

    console.log('No payload - handling as slash command');
    logDeep('body', body);

    const { 
      team_domain: teamDomain,
      command,
    } = body;

    credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

    actionName = command.replace('/', '');

  }

  if (credsPath === null) { // '' is a valid return for base path
    return respond(res, 400, { error: `No creds path found for team domain` });
  }

  const interactivityFunc = actionNameToFunc[actionName];
  console.log('interactivityFunc', interactivityFunc);

  if (!interactivityFunc) {
    return respond(res, 400, { error: `No function found for command "${ actionName }"` });
  }

  return interactivityFunc(req, res);
};

module.exports = {
  slackWebhookRouterApi,
};