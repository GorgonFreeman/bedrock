const { funcApi } = require('../utils');
const { getGoogleCalendarClient } = require('../googlecalendar/googlecalendar.utils');

const googlecalendarEventGet = async (
  eventId,
  {
    credsPath,
    calendarId = 'primary',
  } = {},
) => {

  const calendarClient = getGoogleCalendarClient({ credsPath });

  try {
    const clientResponse = await calendarClient.events.get({
      calendarId,
      eventId,
    });

    return {
      success: true,
      result: clientResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: [error],
    };
  }
};

const googlecalendarEventGetApi = funcApi(googlecalendarEventGet, {
  argNames: ['eventId', 'options'],
});

module.exports = {
  googlecalendarEventGet,
  googlecalendarEventGetApi,
};

// curl localhost:8000/googlecalendarEventGet -H "Content-Type: application/json" -d '{ "eventId": "abc123" }'
