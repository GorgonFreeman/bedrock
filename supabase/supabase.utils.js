const { createClient } = require('@supabase/supabase-js');

const SUPABASE_INSTANCES = new Map();

const supabase = (credsPath) => {
  if (SUPABASE_INSTANCES.has(credsPath)) {
    return SUPABASE_INSTANCES.get(credsPath);
  }

  const creds = credsByPath(['supabase', credsPath]);
  const { 
    BASE_URL, 
    API_KEY,
  } = creds;

  if (!BASE_URL || !API_KEY) {
    throw new Error(`Missing Supabase creds for path: ${ credsPath }`);
  }

  const client = createClient(BASE_URL, API_KEY);
  SUPABASE_INSTANCES.set(credsPath, client);
  return client;
};

module.exports = {
  supabase,
};