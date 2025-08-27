const { respond, logDeep } = require('../utils');

const slackInteractiveTest = async (req, res) => {
  logDeep('slackInteractiveTest', req.body);
  return respond(res, 200, { ok: true });
};

module.exports = slackInteractiveTest;