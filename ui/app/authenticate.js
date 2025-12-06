const { respond } = require('../../utils');

module.exports = async (req, res) => {
  // Set the cookie user=cool and redirect to secure page
  res.writeHead(302, {
    'Location': '/ui/secure',
    'Set-Cookie': 'user=cool; Path=/'
  });
  return res.end();
};

