const { respond, logDeep } = require('../utils');
const { slackMessagePost } = require('./slackMessagePost');

const slackInteractiveTest = async (req, res) => {
  logDeep('slackInteractiveTest', req.body);
  
  const { user_id, channel_id } = req.body;
  
  // Send an interactive message asking for favorite cheese
  const response = await slackMessagePost(
    { channelId: channel_id },
    {
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
              value: 'submit_cheese',
              action_id: 'submit_cheese_btn',
              style: 'primary'
            }
          ]
        }
      ]
    }
  );
  
  // Also respond to the slash command (required by Slack)
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
            value: 'submit_cheese',
            action_id: 'submit_cheese_btn',
            style: 'primary'
          }
        ]
      }
    ]
  });
};

module.exports = slackInteractiveTest;