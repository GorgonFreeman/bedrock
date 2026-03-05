// To redirect a user to a regional URL based on their country.

const geoip = require('geoip-lite');
const { logDeep, respond } = require('../utils');

const bedrock_utilities_geoRedirectApi = async (req, res) => {

  const {
    method,
    headers = {},
    socket,
  } = req;

  if (method !== 'GET') {
    respond(res, 405, { message: `Method not allowed` });
    return;
  }

  let country;

  // Try getting country from Google Cloud Function headers
  ({ 'x-appengine-country': country } = headers);

  if (!country) {
    // Try getting country from Cloudflare headers
    ({ 'cf-ipcountry': country } = headers);
  }

  if (!country) {
    // Fall back to geoip-lite lookup from client IP
    const forwardedFor = headers['x-forwarded-for'];
    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : (headers['x-real-ip'] || socket?.remoteAddress || '').trim();
    
    if (!ip) {
      // TODO: Send to default location
      respond(res, 200, { message: `No IP address found` });
    }

    const geo = geoip.lookup(ip);
    country = geo?.country;
  }

  if (!country) {
    // TODO: Send to default location
    respond(res, 200, { message: `No country found` });
  }

  respond(res, 200, { message: `I don't do anything yet`, country });
};

module.exports = {
  bedrock_utilities_geoRedirectApi,
};

// curl localhost:8000/bedrock_utilities_geoRedirect -H "Content-Type: application/json" -d '{ "arg": "1234" }'