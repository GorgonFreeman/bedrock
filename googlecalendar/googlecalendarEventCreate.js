const { funcApi, objHasAll } = require('../utils');
const { getGoogleCalendarClient } = require('../googlecalendar/googlecalendar.utils');

const googlecalendarEventCreate = async (
  eventData,
  {
    credsPath,
    subject,
    calendarId = 'primary',
  } = {},
) => {

  const calendarClient = getGoogleCalendarClient({ credsPath, subject });

  try {
    const clientResponse = await calendarClient.events.insert({
      calendarId,
      requestBody: eventData,
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

const googlecalendarEventCreateApi = funcApi(googlecalendarEventCreate, {
  argNames: ['eventData', 'options'],
  validatorsByArg: {
    eventData: p => objHasAll(p, ['summary', 'start', 'end']),
  },
});

module.exports = {
  googlecalendarEventCreate,
  googlecalendarEventCreateApi,
};

// curl localhost:8000/googlecalendarEventCreate -H "Content-Type: application/json" -d '{ "eventData": { "summary": "Meeting", "start": { "dateTime": "2026-04-09T10:00:00-04:00" }, "end": { "dateTime": "2026-04-09T11:00:00-04:00" } } }'
