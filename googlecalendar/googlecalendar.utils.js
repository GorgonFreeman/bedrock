// TODO: Consider generalising to just google, and having all clients and functionalities in one directory

const { google } = require('googleapis');
const { credsByPath } = require('../utils');

const GOOGLE_CALENDAR_CLIENTS = new Map();

const getGoogleCalendarClient = ({ credsPath } = {}) => {

  if (GOOGLE_CALENDAR_CLIENTS.has(credsPath)) {
    return GOOGLE_CALENDAR_CLIENTS.get(credsPath);
  }

  const creds = credsByPath(['googlecalendar', credsPath]);
  const { SERVICE_ACCOUNT_JSON } = creds;

  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT_JSON,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({
    version: 'v3',
    auth,
  });

  GOOGLE_CALENDAR_CLIENTS.set(credsPath, calendar);
  return calendar;
};

module.exports = {
  getGoogleCalendarClient,
};

// https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=________
