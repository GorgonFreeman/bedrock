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

const supabaseInterpreter = (response) => {
  const { data, error } = response;
  if (error) {
    return {
      success: false,
      error: [error],
    };
  }

  return {
    success: true,
    result: data,
  };
};

const supabaseRowGet = async (
  credsPath,
  tableName,
  rowField,
  rowValue,
) => {
  const client = getSupabaseClient(credsPath);
  const response = await client
    .from(tableName)
    .select('*')
    .eq(rowField, rowValue)
    .single()
  ;
  return supabaseInterpreter(response);
};

const supabaseRowDelete = async (
  credsPath, 
  tableName, 
  deleteConfig, // { field: 'id', value: 123 } OR { conditions: { field1: 'value1', field2: 'value2' } })
) => {
  const client = getSupabaseClient(credsPath);
  
  // Validate and determine deletion type
  if (!deleteConfig || typeof deleteConfig !== 'object') {
    throw new Error('deleteConfig must be an object with either {field, value} or {conditions}');
  }

  let queryResponse;

  if (deleteConfig.conditions) {
    // Multiple condition deletion (composite key)
    if (typeof deleteConfig.conditions !== 'object') {
      throw new Error('conditions must be an object with field-value pairs');
    }

    console.log(`🗑️  Deleting row with conditions:`, deleteConfig.conditions);
    
    let query = supabase.from(tableName).delete();
    
    Object.entries(deleteConfig.conditions).forEach(([field, value]) => {
      query = query.eq(field, value);
    });
    
    queryResponse = await query;
  } else if (deleteConfig.field && deleteConfig.value !== undefined) {
    // Single field deletion
    console.log(`🗑️  Deleting row where ${deleteConfig.field} = ${deleteConfig.value}`);
    
    queryResponse = await supabase
      .from(tableName)
      .delete()
      .eq(deleteConfig.field, deleteConfig.value);
  } else {
    throw new Error('deleteConfig must have either { field, value } or { conditions }');
  }

  return supabaseInterpreter(queryResponse);
};

const supabaseRowInsert = async (
  credsPath,
  tableName,
  rowObject,
) => {
  const client = getSupabaseClient(credsPath);
  const response = await client
    .from(tableName)
    .insert(rowObject)
  ;
  return supabaseInterpreter(response);
};

const supabaseTableGet = async (
  credsPath,
  tableName,
) => {
  const client = getSupabaseClient(credsPath);
  const response = await client.from(tableName).select('*');
  return supabaseInterpreter(response);
};

const supabaseTableGetAll = async (
  credsPath,
  tableName,
  { 
    orderBy = 'id', 
  } = {},
) => {
  const client = getSupabaseClient(credsPath);

  const rowsCountResponse = await client.from(tableName).select('*', { count: 'exact', head: true });
  const { count: rowsCount } = rowsCountResponse;

  const PAGE_SIZE = 1000;
  let rowsFetched = 0;
  let rows = []; // Separating these in case the number of rows doesn't exactly match count

  while (rowsFetched < rowsCount) {
    const pageRowsResponse = await client.from(tableName).select('*').order(orderBy).range(rowsFetched, (rowsFetched + PAGE_SIZE) - 1);
    const { data, error } = pageRowsResponse;
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    if (!data) {
      break; // No more data
    }
    
    rows.push(...data);
    rowsFetched += PAGE_SIZE;
    console.log(`${ rows.length } / ${ rowsCount }`);
  }

  // console.log(rows);
  return {
    success: true,
    result: rows,
  };
};

// https://supabase.com/docs/reference/javascript/rpc
const supabaseRpc = async (
  credsPath,
  rpcName,
  {
    rpcArgs,
    rpcOptions,

    useMaybeSingle = false,
  } = {},
) => {
  const client = getSupabaseClient(credsPath);
  let query = client.rpc(rpcName, rpcArgs, rpcOptions);
  
  if (useMaybeSingle) {
    query = query.maybeSingle();
  }
  
  const response = await query;
  return supabaseInterpreter(response);
};

module.exports = {
  getSupabaseClient,
  supabaseRowGet,
  supabaseRowGetApi: funcApi(supabaseRowGet, { 
    argNames: ['credsPath', 'tableName', 'rowField', 'rowValue'],
    validatorsByArg: { credsPath: Boolean, tableName: Boolean, rowField: Boolean, rowValue: Boolean },
   }),
  supabaseRowDelete,
  supabaseRowDeleteApi: funcApi(supabaseRowDelete, { 
    argNames: ['credsPath', 'tableName', 'deleteConfig'],
    validatorsByArg: { credsPath: Boolean, tableName: Boolean, deleteConfig: Boolean },
  }),
  supabaseRowInsert,
  supabaseRowInsertApi: funcApi(supabaseRowInsert, { 
    argNames: ['credsPath', 'tableName', 'rowObject'],
    validatorsByArg: { credsPath: Boolean, tableName: Boolean, rowObject: Boolean },
  }),
  supabaseTableGet,
  supabaseTableGetApi: funcApi(supabaseTableGet, { 
    argNames: ['credsPath', 'tableName'],
    validatorsByArg: { credsPath: Boolean, tableName: Boolean },
  }),
  supabaseTableGetAll,
  supabaseTableGetAllApi: funcApi(supabaseTableGetAll, { 
    argNames: ['credsPath', 'tableName', 'options'],
    validatorsByArg: { credsPath: Boolean, tableName: Boolean },
  }),
  supabaseRpc,
  supabaseRpcApi: funcApi(supabaseRpc, { 
    argNames: ['credsPath', 'rpcName', 'options'],
    validatorsByArg: { credsPath: Boolean, rpcName: Boolean },
  }),
};

// curl localhost:8000/supabaseRowGet -H "Content-Type: application/json" -d '{ "credsPath": "foxtron", "tableName": "catalogue_sync_products", "rowField": "handle", "rowValue": "asking-for-more-cap-black" }'
// curl localhost:8000/supabaseTableGetAll -H "Content-Type: application/json" -d '{ "credsPath": "foxtron", "tableName": "catalogue_sync_products", "options": { "orderBy": "handle" } }'
// curl localhost:8000/supabaseRpc -H "Content-Type: application/json" -d '{ "credsPath": "bestie_bonus", "rpcName": "reserve_code", "options": { "rpcArgs": { "allocatedto": "john@whitefoxboutique.com" }, "useMaybeSingle": true } }'