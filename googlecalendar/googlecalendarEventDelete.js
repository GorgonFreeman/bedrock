const { funcApi } = require('../utils');
const { getGoogleCalendarClient } = require('../googlecalendar/googlecalendar.utils');

const googlecalendarEventDelete = async (
  eventId,
  {
    credsPath,
    subject,
    calendarId = 'primary',
  } = {},
) => {

  const calendarClient = getGoogleCalendarClient({ credsPath, subject });

  try {
    const clientResponse = await calendarClient.events.delete({
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

const googlecalendarEventDeleteApi = funcApi(googlecalendarEventDelete, {
  argNames: ['eventId', 'options'],
});

module.exports = {
  googlecalendarEventDelete,
  googlecalendarEventDeleteApi,
};

// curl localhost:8000/googlecalendarEventDelete -H "Content-Type: application/json" -d '{ "eventId": "abc123" }'
