const { respond } = require('../utils');

module.exports = async (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hi</title>
</head>
<body>
  <h1>hi (but JS)</h1>
</body>
</html>`;

  return respond(res, 200, html, { contentType: 'text/html' });
};



