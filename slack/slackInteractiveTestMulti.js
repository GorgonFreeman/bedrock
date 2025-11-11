const { respond, logDeep, customAxios } = require('../utils');

const ACTION_NAME = 'pizza';

const slackInteractiveTestMulti = async (req, res) => {
  console.log('slackInteractiveTestMulti');

  const { body } = req;

  if (!body?.payload) {
    console.log(`Initiation, e.g. slash command`);

    const pizzaToppings = ['cheese', 'pepperoni', 'mushrooms', 'olives', 'anchovies', 'capsicum', 'pineapple', 'artichoke', 'eggplant', 'sundried tomato', 'onion', 'garlic', 'jalapeno', 'bacon'];

    const initialBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "We getting pizza. :yum: What do you want on it?",
        },
        accessory: {
          type: 'static_select',
          action_id: `${ ACTION_NAME }:topping_select`,
          options: pizzaToppings.map(topping => ({
            text: {
              type: 'plain_text',
              text: topping,
            },
            value: topping,
          })),
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
            action_id: `${ ACTION_NAME }:cancel`,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: `I'm done`,
            },
            value: 'done',
            action_id: `${ ACTION_NAME }:done`,
            style: 'primary',
          },
        ],
      },
    ];

    return respond(res, 200, {
      response_type: 'in_channel',
      blocks: initialBlocks,
    });
  }
  
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
  const { 
    action_id: actionId,
    value: actionValue,
  } = action;

  // Derive toppings from posted message, and use it as persistent state
  const currentBlocks = payload.message.blocks;
  const toppingsBlock = currentBlocks.find(block => block.block_id === 'toppingsState');
  let toppings = toppingsBlock?.text?.text?.split(', ') || [];

  let response;

  switch (actionId) {
    // TODO: Consider having user submit topping and using state, rather than recording toppings on change
    case `${ ACTION_NAME }:topping_select`:

      const chosenTopping = action.selected_option.value;

      const toppingsSet = new Set(toppings);
      
      toppingsSet.has(chosenTopping) 
        ? toppingsSet.delete(chosenTopping) 
        : toppingsSet.add(chosenTopping);

      toppings = Array.from(toppingsSet);
      
      let newBlocks = currentBlocks;
      if (toppings.length === 0) {
        // Remove toppings block if no toppings
        newBlocks = newBlocks.filter(block => block.block_id !== 'toppingsState');
      } else if (!toppingsBlock) {
        const newToppingsBlock = {
          type: 'section',
          block_id: 'toppingsState',
          text: {
            type: 'mrkdwn',
            text: toppings.join(', '),
          },
        };
        newBlocks.splice(1, 0, newToppingsBlock);
      } else {
        newBlocks.find(block => block.block_id === 'toppingsState').text.text = toppings.join(', ');
      }

      response = {
        replace_original: 'true',
        blocks: newBlocks,
      };

      break;
    case `${ ACTION_NAME }:cancel`:
      response = {
        replace_original: 'true',
        text: `More pizza for me :yum:`,
      };
      break;
    case `${ ACTION_NAME }:done`:
      response = {
        replace_original: 'true',
        text: toppings.length 
          ? !toppings.includes('cheese')
            ? `Sorry, they wouldn't do one without cheese, said it was against the rules.`
            : toppings.includes('pineapple')
              ? `Yeah, I don't get why it's controversial, pineapple really sets off a pizza. Here you go: :pizza:` 
              : ['pepperoni', 'bacon', 'anchovies'].every(t => !toppings.includes(t))
                ? `Oh...this doesn't look vegetarian... :pizza:` 
                : `Ok, one pizza with ${ toppings.join(', ') }: :pizza:`
          : `Weird but ok: :flatbread:`
        ,
      };
      break;
    default:
      throw new Error(`Unknown actionId: ${ actionId }`);
  }

  logDeep('response', response);
  return customAxios(responseUrl, {
    method: 'post',
    body: response,
  });
};

module.exports = slackInteractiveTestMulti;