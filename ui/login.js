const { respond } = require('../utils');

module.exports = async (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login</title>
</head>
<body>
  <button>I'm cool</button>
</body>
</html>`;

  return respond(res, 200, html, { contentType: 'text/html' });
};

