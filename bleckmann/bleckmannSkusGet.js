const { respond, mandateParam, logDeep } = require('../utils');
const { bleckmannGet } = require('../bleckmann/bleckmann.utils');

const bleckmannSkusGet = async (
  {
    credsPath,
    skip,
    perPage,
    createdFrom,
    createdTo,
    ...getterOptions
  } = {},
) => {

  if (createdFrom && !createdTo) {
    // Extract timezone offset from createdFrom (e.g., "+01:00" from "2024-01-01T00:00:00+01:00")
    const timezoneMatch = createdFrom.match(/[+-]\d{2}:\d{2}$/);
    const timezoneOffset = timezoneMatch ? timezoneMatch[0] : '+01:00';
    
    // Parse the offset to get hours and direction
    const offsetHours = parseInt(timezoneOffset.slice(1, 3));
    const offsetMinutes = parseInt(timezoneOffset.slice(4, 6));
    const isPositive = timezoneOffset.startsWith('+');
    
    // Get current UTC time
    const now = new Date();
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    
    // Convert to target timezone
    let targetHours = isPositive ? utcHours + offsetHours : utcHours - offsetHours;
    let targetMinutes = isPositive ? utcMinutes + offsetMinutes : utcMinutes - offsetMinutes;
    
    // Handle overflow
    if (targetMinutes >= 60) {
      targetHours += Math.floor(targetMinutes / 60);
      targetMinutes = targetMinutes % 60;
    }
    if (targetHours >= 24) {
      targetHours = targetHours % 24;
    }
    
    // Format the date in target timezone using slice
    const dateString = now.toISOString().slice(0, 19); // Get YYYY-MM-DDTHH:mm:ss part
    const targetTimeString = `${String(targetHours).padStart(2, '0')}:${String(targetMinutes).padStart(2, '0')}:${String(utcSeconds).padStart(2, '0')}`;
    createdTo = dateString.replace(/\d{ 2 }:\d{ 2 }:\d{ 2 }$/, targetTimeString) + timezoneOffset;
  }

  const response = await bleckmannGet(
    '/skus',
    {
      credsPath,
      params: {
        ...(skip && { skip }),
        ...(createdFrom && { createdFrom }),
        ...(createdTo && { createdTo }),
      },
      ...(perPage && { perPage }),
      ...getterOptions,
    },
  );
  logDeep(response);
  return response;
};

const bleckmannSkusGetApi = async (req, res) => {
  const {
    options,
  } = req.body;

  // const paramsValid = await Promise.all([
  //   mandateParam(res, 'arg', arg),
  // ]);
  // if (paramsValid.some(valid => valid === false)) {
  //   return;
  // }

  const result = await bleckmannSkusGet(
    options,
  );
  respond(res, 200, result);
};

module.exports = {
  bleckmannSkusGet,
  bleckmannSkusGetApi,
};

// curl localhost:8000/bleckmannSkusGet
// curl localhost:8000/bleckmannSkusGet -H "Content-Type: application/json" -d '{ "options": { "limit": 100 } }'
// curl localhost:8000/bleckmannSkusGet -H "Content-Type: application/json" -d '{ "options": { "createdFrom": "2024-01-01T00:00:00+01:00" } }'