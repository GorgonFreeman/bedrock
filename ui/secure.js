const { respond } = require('../utils');

module.exports = async (req, res) => {
  // Check for the cookie "user=cool"
  const cookies = req.headers.cookie || '';
  const hasCoolUserCookie = cookies.split(';').some(cookie => {
    const [name, value] = cookie.trim().split('=');
    return name === 'user' && value === 'cool';
  });

  // If cookie is not present, redirect to login
  if (!hasCoolUserCookie) {
    res.writeHead(302, { Location: '/ui/login' });
    return res.end();
  }

  // User has the cookie, show the content
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Secure</title>
</head>
<body>
  <h1>Only cool people can see this</h1>
</body>
</html>`;

  return respond(res, 200, html, { contentType: 'text/html' });
};