const { funcApi } = require('../utils');
const { getGoogleCalendarClient } = require('../googlecalendar/googlecalendar.utils');

const googlecalendarEventsGet = async (
  {
    credsPath,
    subject,
    calendarId = 'primary',
    timeMin,
    timeMax,
    maxResults = 50,
    orderBy = 'startTime',
    singleEvents = true,
    q,
  } = {},
) => {

  const calendarClient = getGoogleCalendarClient({ credsPath, subject });

  try {
    const clientResponse = await calendarClient.events.list({
      calendarId,
      ...timeMin && { timeMin },
      ...timeMax && { timeMax },
      maxResults,
      orderBy,
      singleEvents,
      ...q && { q },
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

const googlecalendarEventsGetApi = funcApi(googlecalendarEventsGet, {
  argNames: ['options'],
});

module.exports = {
  googlecalendarEventsGet,
  googlecalendarEventsGetApi,
};

// curl localhost:8000/googlecalendarEventsGet
// curl localhost:8000/googlecalendarEventsGet -H "Content-Type: application/json" -d '{ "options": { "calendarId": "primary", "maxResults": 10 } }'
