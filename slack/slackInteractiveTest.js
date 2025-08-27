const { respond, logDeep, customAxios } = require('../utils');

const slackInteractiveTest = async (req, res) => {
  console.log('slackInteractiveTest');

  const { body } = req;
  
  if (body?.payload) {
    console.log(`Received payload - handling as interactive step`);

    respond(res, 200); // Acknowledgement - we'll provide the next step to the response_url later

    const payload = JSON.parse(body.payload);
    logDeep('payload', payload);

    const { 
      response_url: responseUrl,
      state, 
      actions, 
    } = payload;

    const action = actions?.[0];
    const { value: actionValue } = action;

    if (!actionValue) {
      throw new Error('No action value');
    }

    if (actionValue === 'cancel') {
      const response = {
        delete_original: 'true',
      };
      return customAxios(responseUrl, {
        method: 'post',
        body: response,
      });
    }

    // actionValue 'submit'
    const userAnswer = state?.values?.answer_input?.answer_text?.value;

    const response = { 
      replace_original: 'true',
      text: `You answered "${ userAnswer }"`,
    };

    logDeep('response', response);
    return customAxios(responseUrl, {
      method: 'post',
      body: response,
    });
  }
  
  console.log(`No payload - initiation, e.g. slash command`);
  
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
      block_id: 'answer_input',
      element: {
        type: 'plain_text_input',
        action_id: 'answer_text',
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
            text: 'Cancel',
          },
          value: 'cancel',
          action_id: 'test:cancel',
        },
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