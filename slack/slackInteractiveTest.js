const { respond, logDeep } = require('../utils');

const slackInteractiveTest = async (req, res) => {
  logDeep('slackInteractiveTest', req.body);
  
  const { user_id, channel_id } = req.body;
  
  // Respond directly with the interactive cheese question
  return respond(res, 200, {
    response_type: 'in_channel',
    text: "What's your favourite cheese?",
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "What's your favourite cheese?"
        }
      },
      {
        type: 'input',
        block_id: 'cheese_input',
        element: {
          type: 'plain_text_input',
          action_id: 'cheese_text_input',
          placeholder: {
            type: 'plain_text',
            text: 'Enter your favorite cheese here...'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Your Answer'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Submit'
            },
            value: 'submit',
            action_id: 'test:submit',
            style: 'primary'
          }
        ]
      }
    ]
  });
};

module.exports = slackInteractiveTest;