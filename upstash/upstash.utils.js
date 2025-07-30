const { Redis } = require('@upstash/redis');
const { credsByPath, funcApi } = require('../utils');

const UPSTASH_INSTANCES = new Map();

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
    url: BASE_URL,
    token: TOKEN,
  });

  return redis;
};

const getRedisInstance = ({ credsPath } = {}) => {
  const key = credsPath || 'default';
  
  if (UPSTASH_INSTANCES.has(key)) {
    return UPSTASH_INSTANCES.get(key);
  }
  
  const redis = upstashRedis({ credsPath });
  UPSTASH_INSTANCES.set(key, redis);
  return redis;
};

const upstashGet = async (
  key,
  { credsPath } = {},
) => {
  const redis = getRedisInstance({ credsPath });
  
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
  const redis = getRedisInstance({ credsPath });
  
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
  const redis = getRedisInstance({ credsPath });
  
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
  const redis = getRedisInstance({ credsPath });
  
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
  upstashGetApi: funcApi(upstashGet, { argNames: ['key', 'options'] }),
  upstashSetApi: funcApi(upstashSet, { argNames: ['key', 'value', 'options'] }),
  upstashDelApi: funcApi(upstashDel, { argNames: ['key', 'options'] }),
  upstashExistsApi: funcApi(upstashExists, { argNames: ['key', 'options'] }),
}; 