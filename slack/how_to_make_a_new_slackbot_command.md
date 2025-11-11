# How to Make a New Slackbot Command

1. Make a new Slack function using `npm run new` > `slack` > `bot`

1. Add the function to the Slack router's lookup, at `slackWebhookRouter` > `commandNameToFunc`

1. Run `npm run dev` and `npm run tunnel`. This exposes your local server on a public url.

1. Set up a new slash command in your Slack app, at e.g. `https://api.slack.com/apps/________/slash-commands`. For the moment, set the Request URL to your tunnel, e.g. `https://13c2c2496465.ngrok-free.app/slackWebhookRouter`

1. Change the Slack app to send interactivity webhooks to the tunnel url as well, at e.g. `https://api.slack.com/apps/________/interactive-messages`

1. Use the slash command in Slack and get started! 

When you're done, deploy the updated `slackWebhookRouter`, and change your slash command and app interactivity endpoint to the hosted url.

---

## Notes

- The `COMMAND_NAME` constant in your function file should match the slash command
- Action IDs in interactive components should be prefixed with `${ COMMAND_NAME }:` (e.g., `${ COMMAND_NAME }:action_name`) - this is how the router finds the command from an interactivity payload
- Make sure your ngrok URL is updated in Slack whenever you restart the tunnel
