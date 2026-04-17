const { respond, logDeep } = require('../utils');
const { TEAM_DOMAIN_TO_CREDSPATH } = require('../slack/slack.constants');

const commandNameToFunc = {
  'test': require('../slack/slackInteractiveTest'),
  'pizza': require('../slack/slackInteractiveTestMulti'),
  'suggestion_box': require('../slack/slackInteractiveSuggestionBox'),
  'stock_check': require('../slack/slackInteractiveStockCheck'),
  'customer_delete': require('../slack/slackInteractiveCustomerDelete'),
  'staff_onboard': require('../bedrock_unlisted/bedrock_unlisted_slackInteractiveStaffOnboard'),
  'staff_offboard': require('../bedrock_unlisted/bedrock_unlisted_slackInteractiveStaffOffboard'),
  'product_data_check': require('../slack/slackInteractiveProductDataCheck'),
  'bleckmann_declines_export': require('../bedrock_unlisted/bedrock_unlisted_slackInteractiveBleckmannDeclinesExport'),
  'inventory_hold': require('../bedrock_unlisted/bedrock_unlisted_slackInteractiveInventoryHold'),
  'customer_bday_code_create': require('../bedrock_unlisted/bedrock_unlisted_slackInteractiveBirthdayDiscountCodeGenerate'),
  'product_sync': require('../slack/slackInteractiveProductSync'),
};

const slackWebhookRouterApi = async (req, res) => {
  // TODO: Verify request is from Slack

  let credsPath;
  let commandName;

  const { body } = req;
  
  if (body?.payload) {

    console.log('Received payload - handling as interactivity step');

    const payload = JSON.parse(body.payload);
    // logDeep('payload', payload);

    const { team } = payload;
    const { domain: teamDomain } = team;

    credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

    // Get commandName from action_id
    const actionId = payload?.action_id || payload?.actions?.[0]?.action_id;
    commandName = actionId?.split(':')?.[0];

  } else {

    console.log('No payload - handling as slash command');
    logDeep('body', body);

    const { 
      team_domain: teamDomain,
      command,
    } = body;

    credsPath = TEAM_DOMAIN_TO_CREDSPATH[teamDomain];

    commandName = command.replace('/', '');

  }

  commandName = commandName.replaceAll('dev__', '');

  if (credsPath === null) { // '' is a valid return for base path
    return respond(res, 400, { error: `No creds path found for team domain` });
  }

  const interactivityFunc = commandNameToFunc[commandName];
  console.log('interactivityFunc', interactivityFunc);

  if (!interactivityFunc) {
    return respond(res, 400, { error: `No function found for command "${ commandName }"` });
  }

  return interactivityFunc(req, res);
};

module.exports = {
  slackWebhookRouterApi,
};