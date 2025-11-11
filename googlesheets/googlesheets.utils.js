// TODO: Consider generalising to just google, and having all clients and functionalities in one directory

const { google } = require('googleapis');
const { credsByPath } = require('../utils');

const getGoogleSheetsClient = ({ credsPath } = {}) => {
  const creds = credsByPath(['googlesheets', credsPath]);
  const { SERVICE_ACCOUNT_JSON } = creds;

  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT_JSON,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  
  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  return sheets;
};

module.exports = {
  getGoogleSheetsClient,
};