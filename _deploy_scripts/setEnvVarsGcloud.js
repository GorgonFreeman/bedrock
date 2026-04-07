/**
 * gcloud --set-env-vars uses comma between KEY=VALUE pairs; values that contain commas
 * (e.g. JSON) must use the alternate delimiter form from `gcloud topic escaping`.
 * @see https://cloud.google.com/sdk/gcloud/reference/topic/escaping
 */

function splitSetEnvVarsPairs(combined) {
  const segments = combined.split(/,(?=[A-Za-z_][A-Za-z0-9_]*=)/);
  return segments.map((segment) => {
    const eq = segment.indexOf('=');
    if (eq === -1) {
      throw new Error(`Invalid set_env_vars segment (no =): ${ segment }`);
    }
    return {
      key: segment.slice(0, eq).trim(),
      value: segment.slice(eq + 1),
    };
  });
}

function pickDelimiter(pairs) {
  const blob = pairs.map((p) => `${ p.key }=${ p.value }`).join('');
  for (let n = 3; n < 64; n++) {
    const delim = '#'.repeat(n);
    if (!blob.includes(delim)) {
      return delim;
    }
  }
  throw new Error('Could not find a delimiter for gcloud --set-env-vars (values too dense)');
}

/**
 * @param { string } combined e.g. HOSTED=true,GEOREDIRECT_URL_MAP={"a":"b","c":"d"}
 * @returns { string } string for gcloud --set-env-vars (may use ^###^... form)
 */
function formatSetEnvVarsForGcloud(combined) {
  const pairs = splitSetEnvVarsPairs(combined);
  if (pairs.length === 0) {
    return combined;
  }
  const needsDelimiter = pairs.length > 1 || pairs.some((p) => p.value.includes(','));
  if (!needsDelimiter) {
    return combined;
  }
  const delim = pickDelimiter(pairs);
  return `^${ delim }^${ pairs.map((p) => `${ p.key }=${ p.value }`).join(delim) }`;
}

/** Bash-safe single-quoted string for shell -c. */
function shellQuoteSingle(s) {
  return `'${ String(s).replace(/'/g, `'\\''`) }'`;
}

module.exports = {
  splitSetEnvVarsPairs,
  formatSetEnvVarsForGcloud,
  shellQuoteSingle,
};
