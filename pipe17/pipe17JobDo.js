const { funcApi, logDeep, wait, seconds, askQuestion } = require('../utils');

const { pipe17JobCreate } = require('../pipe17/pipe17JobCreate');
const { pipe17JobGet } = require('../pipe17/pipe17JobGet');
const { pipe17JobResultsGet } = require('../pipe17/pipe17JobResultsGet');

const pipe17JobDo = async (
  jobCreateArgs,
  {
    jobCreateOptions,
    credsPath,
  } = {},
) => {

  const commonOptions = {
    credsPath,
  };

  const jobCreateResponse = await pipe17JobCreate(...jobCreateArgs, { ...commonOptions, ...jobCreateOptions });

  const {
    success: jobCreateSuccess,
    result: jobCreateResult,
  } = jobCreateResponse;
  if (!jobCreateSuccess) {
    return jobCreateResponse;
  }

  const { jobId } = jobCreateResult;

  let finished;

  const waitingStatuses = [
    'processing',
  ];
  const completeStatuses = [
    'completed',
  ];
  const failedStatuses = [
    'failed',
  ];

  do {
    await wait(seconds(5));

    const jobGetResponse = await pipe17JobGet(jobId, commonOptions);
    const {
      success: jobGetSuccess,
      result: jobGetResult,
    } = jobGetResponse;
    if (!jobGetSuccess) {
      return jobGetResponse;
    }

    const {
      status,
    } = jobGetResult;

    if (waitingStatuses.includes(status)) {
      continue;
    }

    if (failedStatuses.includes(status)) {
      return {
        success: false,
        errors: [jobGetResponse],
      };
    }

    if (completeStatuses.includes(status)) {
      finished = true;
      break;
    }
    
    // Unrecognised status, ask user what to do
    const action = await askQuestion(`Unrecognised status: ${ status } - [w]ait/[c]ontinue/[f]ailed`);
    switch (action) {
      case 'w':
        continue;
      case 'c':
        finished = true;
        break;
      case 'f':
      default:
        return {
          success: false,
          errors: [jobGetResponse],
        };
    }

  } while (!finished);

  const jobResultsGetResponse = await pipe17JobResultsGet(jobId, commonOptions);
  const {
    success: jobResultsGetSuccess,
    result: jobResult,
  } = jobResultsGetResponse;
  if (!jobResultsGetSuccess) {
    return jobResultsGetResponse;
  }

  const response = {
    success: true,
    result: jobResult,
  };
  logDeep(response);
  return response;
};

const pipe17JobDoApi = funcApi(pipe17JobDo, {
  argNames: ['jobCreateArgs', 'options'],
  validatorsByArg: {
    jobCreateArgs: Array.isArray,
  },
});

module.exports = {
  pipe17JobDo,
  pipe17JobDoApi,
};

// curl localhost:8000/pipe17JobDo -H "Content-Type: application/json" -d '{ "jobCreateArgs": ["report", "open_orders"] }'