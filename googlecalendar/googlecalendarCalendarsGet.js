const { funcApi } = require('../utils');
const { getGoogleCalendarClient } = require('../googlecalendar/googlecalendar.utils');

const googlecalendarCalendarsGet = async (
  {
    credsPath,
    subject,
  } = {},
) => {

  const calendarClient = getGoogleCalendarClient({ credsPath, subject });

  try {
    const clientResponse = await calendarClient.calendarList.list();

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

const googlecalendarCalendarsGetApi = funcApi(googlecalendarCalendarsGet, {
  argNames: ['options'],
});

module.exports = {
  googlecalendarCalendarsGet,
  googlecalendarCalendarsGetApi,
};

// curl localhost:8000/googlecalendarCalendarsGet
