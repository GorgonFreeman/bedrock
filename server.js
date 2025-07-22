const http = require('http');

const functions = require('./servable');
const { respond, arrayFromIntRange, logDeep } = require('./utils');
const { getRequestBody, errorToReadable } = require('./server.utils');

const createServer = () => {
  const server = http.createServer(async (req, res) => {
    
    const { url, headers } = req;
  
    const body = await getRequestBody(req);
    // console.log('body', body);
    
    const funcName = url.split('/').pop();

    const func = functions[funcName];

    console.log(func);

    if (!func) {
      return respond(res, 404, { message: `Endpoint not supported: ${ req.url }` });
    }

    // Pass on the parsed body to the function
    const parsedReq = {
      ...req,
      body,
      // Not sure why we need this but it's undefined otherwise
      headers,
    };
    
    try {

      const result = await func(parsedReq, res);

      // Respond with the result if the function hasn't already responded
      if (res.headersSent) {
        return;
      }

      respond(res, 200, result);
      
    } catch(err) {

      logDeep(funcName, err);

      // External error logging?
      
      respond(res, 500, {
        success: false,
        errors: [errorToReadable(err)],
      });

    }
  });

  return server;
};

const { PORT = 8000 } = process.env;

const maxPort = parseInt(PORT) + 5;
const ports = arrayFromIntRange(PORT, maxPort);

for (port of ports) {
  const server = createServer();
  server.listen(port, console.log(`Server running on port ${ port }`));
}
