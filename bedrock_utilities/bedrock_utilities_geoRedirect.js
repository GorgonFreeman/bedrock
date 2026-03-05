// To redirect a user to a regional URL based on their country.
/* 
  Deploy it with a .env variable GEOREDIRECT_URL_MAP, which is a JSON object like the following:
  {
    fallback: 'https://www.ikea.com',
    any: 'https://www.ikea.com/[country]',
    AU: 'https://www.ikea.com/au',
    US: 'https://www.ikea.com/us',
    GB: 'https://www.ikea.com/gb',
    DE: 'https://www.ikea.com/de',
    FR: 'https://www.ikea.com/fr',
    NZ: 'https://www.ikea.com/nz',
  }
*/

require('dotenv').config();
const geoip = require('geoip-lite');

let { GEOREDIRECT_URL_MAP } = process.env;

const { logDeep, respond } = require('../utils');

const bedrock_utilities_geoRedirectApi = async (req, res) => {

  if (!GEOREDIRECT_URL_MAP) {
    return respond(res, 500, { message: `GEOREDIRECT_URL_MAP is not set` });
  }

  let urlMap;
  try {
    urlMap = typeof GEOREDIRECT_URL_MAP === 'string'
      ? JSON.parse(GEOREDIRECT_URL_MAP)
      : GEOREDIRECT_URL_MAP;
  } catch (err) {
    console.warn(err);
    return respond(res, 500, { message: `Error parsing GEOREDIRECT_URL_MAP`, err });
  }

  const fallbackUrl = urlMap?.fallback;
  if (!fallbackUrl) {
    return respond(res, 500, { message: `GEOREDIRECT_URL_MAP must have a fallback key` });
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
  console.log('Trying Cloud Function country header');
  ({ 'x-appengine-country': country } = headers);

  if (!country) {
    // Try getting country from Cloudflare headers
    console.log('Trying Cloudflare country header');
    ({ 'cf-ipcountry': country } = headers);
  }

  if (!country) {
    // Fall back to geoip-lite lookup from client IP
    console.log('Trying geoip-lite lookup');
    const forwardedFor = headers['x-forwarded-for'];
    const ip = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : (headers['x-real-ip'] || socket?.remoteAddress || '').trim();
    
    logDeep({ ip });
    
    if (!ip) {
      console.warn(`No IP address found`);
      return res.writeHead(302, { 'Location': fallbackUrl }).end();
    }

    const geo = geoip.lookup(ip);
    logDeep({ geo });
    country = geo?.country;
  }

  if (!country) {
    console.warn(`No country found`);
    return res.writeHead(302, { 'Location': fallbackUrl }).end();
  }

  const redirectUrl = urlMap[country.toUpperCase()] || urlMap?.any?.replace('[country]', country.toLowerCase()) || fallbackUrl;
  return res.writeHead(302, { 'Location': redirectUrl }).end();
};

module.exports = {
  bedrock_utilities_geoRedirectApi,
};

// curl https://db75-14-200-157-146.ngrok-free.app/bedrock_utilities_geoRedirect