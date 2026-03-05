// To redirect a user to a regional URL based on their country.

const { logDeep, respond } = require('../utils');

const bedrock_utilities_geoRedirectApi = async (req, res) => {

  const { 
    method,
    headers = {},
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
    // Use some kind of geo IP setup
  }

  respond(res, 200, { message: `I don't do anything yet` });
};

module.exports = {
  bedrock_utilities_geoRedirectApi,
};

// curl localhost:8000/bedrock_utilities_geoRedirect -H "Content-Type: application/json" -d '{ "arg": "1234" }'