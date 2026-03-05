// To redirect a user to a regional URL based on their country.
/* 
  Deploy it with a .env variable GEOREDIRECT_URL_MAP, which is a JSON object like the following:
  {
    default: 'https://www.ikea.com',
    AU: 'https://www.ikea.com/au',
    US: 'https://www.ikea.com/us',
    GB: 'https://www.ikea.com/gb',
    DE: 'https://www.ikea.com/de',
    FR: 'https://www.ikea.com/fr',
    NZ: 'https://www.ikea.com/nz',
  }
  TODO: Consider more powerful formats or a transformation function, or supporting interpolation in default address
*/

require('dotenv').config();
const geoip = require('geoip-lite');

const { GEOREDIRECT_URL_MAP } = process.env;

const { logDeep, respond } = require('../utils');

const bedrock_utilities_geoRedirectApi = async (req, res) => {

  if (!GEOREDIRECT_URL_MAP) {
    return respond(res, 500, { message: `GEOREDIRECT_URL_MAP is not set` });
  }

  const {
    method,
    headers = {},
    socket,
  } = req;

  if (method !== 'GET') {
    return respond(res, 405, { message: `Method not allowed` });
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
      return respond(res, 200, { message: `No IP address found` });
    }

    const geo = geoip.lookup(ip);
    country = geo?.country;
  }

  if (!country) {
    // TODO: Send to default location
    return respond(res, 200, { message: `No country found` });
  }

  return respond(res, 200, { message: `I don't do anything yet`, country });
};

module.exports = {
  bedrock_utilities_geoRedirectApi,
};

// curl localhost:8000/bedrock_utilities_geoRedirect -H "Content-Type: application/json" -d '{ "arg": "1234" }'