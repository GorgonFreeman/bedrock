const Busboy = require('busboy');
const qs = require('qs');
const stringToType = require('string-to-type');

const errorToReadable = (err) => {
  const {
    name,
    stack,
    message,
    code,
  } = err;

  return {
    ...name && { name },
    ...stack && { stack },
    ...message && { message },
    ...code && { code },
  };
};

// Parse multipart/form-data using busboy
const parseMultipartFormData = (req, { useRawBody } = {}) => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = {};

    busboy.on('field', (fieldname, val) => {
      console.log('field', fieldname, val);
      fields[fieldname] = val;
    });

    busboy.on('file', (fieldname, file, fileInfo) => {
      console.log('file', fieldname, file, fileInfo);
      const { filename, encoding, mimeType } = fileInfo;

      const chunks = [];

      file.on('data', (data) => {
        console.log('data', data);
        chunks.push(data);
      });

      file.on('end', () => {
        console.log('end');
        files[fieldname] = {
          filename,
          encoding,
          mimeType,
          buffer: Buffer.concat(chunks),
        };
      });

    });

    busboy.on('finish', () => {
      console.log('finish');
      resolve({ fields, files });
    });

    busboy.on('error', (err) => {
      console.log('error');
      reject(err);
    });

    if (useRawBody) {
      busboy.end(req.rawBody);
    }

    req.pipe(busboy);
  });
};

const parseCommonRequests = (req) => {
  return new Promise((resolve, reject) => {
    const chunks = [];

    const { headers } = req;
    const { 'content-type': contentType } = headers;

    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', async () => {
      try {
        const rawBody = Buffer.concat(chunks);
        req.rawBody = rawBody;

        let body = rawBody.toString('utf8');

        if (contentType === 'application/json') {
          // Only parse JSON if body is not empty
          body = body.trim() ? JSON.parse(body) : {};

        } else if (contentType === 'application/x-www-form-urlencoded') {

          body = qs.parse(body, {
            decoder: (str, decoder, charset) => {
              const decoded = decoder(str, charset);
              return stringToType(decoded);
            },
          });

        }
        resolve(body);
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
};

const getRequestBody = async (req) => {
  let body = {};

  const { headers } = req;
  const { 'content-type': contentType } = headers;

  if (!contentType) {
    return parseCommonRequests(req);
  }

  if (contentType.includes('multipart/form-data')) {
    body = await parseMultipartFormData(req);
  } else {
    body = await parseCommonRequests(req);
  }

  return body;
};

module.exports = {
  errorToReadable,
  getRequestBody,
};