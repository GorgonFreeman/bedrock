const { createClient } = require('@supabase/supabase-js');
const { credsByPath, funcApi } = require('../utils');

const SUPABASE_INSTANCES = new Map();

const getSupabaseClient = (credsPath) => {
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

const supabaseRowGet = async (
  credsPath,
  tableName,
  rowField,
  rowValue,
) => {
  const client = getSupabaseClient(credsPath);
  const { data, error } = await client
    .from(tableName)
    .select('*')
    .eq(rowField, rowValue)
    .single()
  ;

  if (error) {
    return {
      success: false,
      errors: [error],
    };
  }

  return {
    success: true,
    results: data,
  };
};

module.exports = {
  getSupabaseClient,
  supabaseRowGet,
  supabaseRowGetApi: funcApi(supabaseRowGet, { argNames: ['credsPath', 'tableName', 'rowField', 'rowValue'] }),
};

// curl localhost:8000/supabaseRowGet -H "Content-Type: application/json" -d '{ "credsPath": "foxtron", "tableName": "catalogue_sync_products", "rowField": "handle", "rowValue": "asking-for-more-cap-black" }'