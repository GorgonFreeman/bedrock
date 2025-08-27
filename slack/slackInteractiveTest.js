const { respond, logDeep } = require('../utils');

const slackInteractiveTest = async (req, res) => {
  logDeep('slackInteractiveTest', req.body);

  const { body } = req;
  
  // Payload - in an interactive step
  if (body?.payload) {
    const payload = JSON.parse(body.payload);
    logDeep('payload', payload);

    const { 
      state, 
      actions, 
    } = payload;

    return respond(res, 200, { state });
  }
  
  // No payload - initiated, e.g. through slash command
  const initialBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: "What's your favourite cheese?",
      },
    },
    {
      type: 'input',
      block_id: 'cheese_input',
      element: {
        type: 'plain_text_input',
        action_id: 'cheese_text_input',
        placeholder: {
          type: 'plain_text',
          text: 'Enter your favorite cheese here...',
        },
      },
      label: {
        type: 'plain_text',
        text: 'Your Answer',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Submit',
          },
          value: 'submit',
          action_id: 'test:submit',
          style: 'primary',
        },
      ],
    },
  ];

  return respond(res, 200, {
    response_type: 'in_channel',
    blocks: initialBlocks,
  });
};

module.exports = slackInteractiveTest;