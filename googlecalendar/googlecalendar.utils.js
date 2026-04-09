// TODO: Consider generalising to just google, and having all clients and functionalities in one directory

const { google } = require('googleapis');
const { credsByPath } = require('../utils');

const GOOGLE_CALENDAR_CLIENTS = new Map();

const getGoogleCalendarClient = ({ credsPath, subject } = {}) => {

  const cacheKey = `${ credsPath }:${ subject || '' }`;

  if (GOOGLE_CALENDAR_CLIENTS.has(cacheKey)) {
    return GOOGLE_CALENDAR_CLIENTS.get(cacheKey);
  }

  const creds = credsByPath(['googlecalendar', credsPath]);
  const { SERVICE_ACCOUNT_JSON } = creds;

  const auth = subject
    ? new google.auth.JWT({
      email: SERVICE_ACCOUNT_JSON.client_email,
      key: SERVICE_ACCOUNT_JSON.private_key,
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject,
    })
    : new google.auth.GoogleAuth({
      credentials: SERVICE_ACCOUNT_JSON,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

  const calendar = google.calendar({
    version: 'v3',
    auth,
  });

  GOOGLE_CALENDAR_CLIENTS.set(cacheKey, calendar);
  return calendar;
};

module.exports = {
  getGoogleCalendarClient,
};

// https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=________
