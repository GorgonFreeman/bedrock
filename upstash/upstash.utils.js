const { Redis } = require('@upstash/redis');
const { credsByPath } = require('../utils');

const upstashRedis = ({ credsPath } = {}) => {
  // returns { redis }
  
  const creds = credsByPath(['upstash', credsPath]);
  const { 
    BASE_URL, 
    TOKEN,
  } = creds;

  if (!BASE_URL || !TOKEN) {
    throw new Error(`Missing Upstash creds for path: ${ credsPath }`);
  }

  const redis = new Redis({
    baseUrl: BASE_URL,
    token: TOKEN,
  });

  return redis;
};

const upstashGet = async (
  key,
  { credsPath } = {},
) => {
  const redis = upstashRedis({ credsPath });
  
  try {
    const result = await redis.get(key);
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('upstashGet error', error);
    return {
      success: false,
      error: [error.message],
    };
  }
};

const upstashSet = async (
  key,
  value,
  { 
    credsPath,
    ...upstashSetOptions
    /*
      ex: expiration in seconds
      nx: only set if key doesn't exist
      xx: only set if key exists
    */
  } = {},
) => {
  const redis = upstashRedis({ credsPath });
  
  try {
    
    const result = await redis.set(key, value, upstashSetOptions);
    
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('upstashSet error', error);
    return {
      success: false,
      error: [error.message],
    };
  }
};

const upstashDel = async (
  key,
  { credsPath } = {},
) => {
  const redis = upstashRedis({ credsPath });
  
  try {
    const result = await redis.del(key);
    
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('upstashDel error', error);
    return {
      success: false,
      error: [error.message],
    };
  }
};

const upstashExists = async (
  key,
  { credsPath } = {},
) => {
  const redis = upstashRedis({ credsPath });
  
  try {
    const result = await redis.exists(key);
    
    return {
      success: true,
      result: result === 1,
    };
  } catch (error) {
    console.error('upstashExists error', error);
    return {
      success: false,
      error: [error.message],
    };
  }
};

module.exports = {
  upstashGet,
  upstashSet,
  upstashDel,
  upstashExists,
}; 