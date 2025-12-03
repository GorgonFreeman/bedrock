// TODO: Consider generalising to just google, and having all clients and functionalities in one directory

const { google } = require('googleapis');
const { credsByPath } = require('../utils');

const GOOGLE_DRIVE_CLIENTS = new Map();

const getGoogleDriveClient = ({ credsPath } = {}) => {

  if (GOOGLE_DRIVE_CLIENTS.has(credsPath)) {
    return GOOGLE_DRIVE_CLIENTS.get(credsPath);
  }

  const creds = credsByPath(['googledrive', credsPath]);
  const { SERVICE_ACCOUNT_JSON } = creds;

  const auth = new google.auth.GoogleAuth({
    credentials: SERVICE_ACCOUNT_JSON,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  
  const drive = google.drive({
    version: 'v3',
    auth,
  });
  
  GOOGLE_DRIVE_CLIENTS.set(credsPath, drive);
  return drive;
};

module.exports = {
  getGoogleDriveClient,
};

// https://console.cloud.google.com/apis/library/drive.googleapis.com?project=________