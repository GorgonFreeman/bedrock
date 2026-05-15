// TODO: Consider generalising to just google, and having all clients and functionalities in one directory

const { BigQuery } = require('@google-cloud/bigquery');
const { credsByPath } = require('../utils');

const BIGQUERY_CLIENTS = new Map();

const clientCacheKey = ({ credsPath, projectId }) =>
  `${ credsPath ?? '' }:${ projectId ?? '' }`;

const resolveProjectId = ({ creds, projectId }) =>
  projectId
  || creds.BIGQUERY_PROJECT_ID
  || creds.GCP_PROJECT_ID
  || creds.SERVICE_ACCOUNT_JSON?.project_id;

const getBigQueryClient = ({ credsPath, projectId } = {}) => {
  const creds = credsByPath(['bigquery', credsPath]);
  const resolvedProjectId = resolveProjectId({ creds, projectId });

  if (!resolvedProjectId) {
    throw new Error(
      'BigQuery needs a project id: pass projectId, or set BIGQUERY_PROJECT_ID or GCP_PROJECT_ID in creds, or use a service account JSON with project_id.',
    );
  }

  if (!creds.SERVICE_ACCOUNT_JSON) {
    throw new Error(
      `BigQuery needs SERVICE_ACCOUNT_JSON in creds at CREDS.bigquery${ credsPath ? `.${ credsPath }` : '' }.`,
    );
  }

  const key = clientCacheKey({ credsPath, projectId: resolvedProjectId });
  if (BIGQUERY_CLIENTS.has(key)) {
    return BIGQUERY_CLIENTS.get(key);
  }

  const client = new BigQuery({
    projectId: resolvedProjectId,
    credentials: creds.SERVICE_ACCOUNT_JSON,
  });

  BIGQUERY_CLIENTS.set(key, client);
  return client;
};

/**
 * Runs a SQL query and returns rows after the job finishes. For very large
 * results, use getBigQueryClient and createQueryJob / getQueryResults yourself.
 *
 * @param {object} options
 * @param {string} [options.credsPath] - Key under CREDS.bigquery (e.g. prod).
 * @param {string} [options.projectId] - GCP project id; overrides values from creds.
 * @param {string} options.query - Standard SQL.
 * @param {object} [options.params] - Named parameters (use @name in SQL).
 * @param {string} [options.location] - Job location, e.g. US or EU.
 * @param {{ datasetId: string, projectId?: string }} [options.defaultDataset]
 * Additional keys are forwarded to client.query (e.g. maximumBytesBilled).
 */
const runBigQueryQuery = async (options) => {
  const {
    credsPath,
    projectId,
    query,
    params,
    location,
    defaultDataset,
    ...rest
  } = options;

  const client = getBigQueryClient({ credsPath, projectId });

  const queryOptions = {
    query,
    ...(params != null && { params }),
    ...(location && { location }),
    ...(defaultDataset && { defaultDataset }),
    ...rest,
  };

  const [rows] = await client.query(queryOptions);
  return rows;
};

module.exports = {
  getBigQueryClient,
  runBigQueryQuery,
};

// https://console.cloud.google.com/apis/library/bigquery.googleapis.com?project=________
