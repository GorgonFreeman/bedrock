const { readFileYaml, interactiveChooseOption } = require('../utils');
const { execCommand } = require('./execCommand');

(async() => {
  try {
    const hostingYml = await readFileYaml('.hosting.yml');
    console.log(hostingYml);

    const { 
      google_cloud_info: gcloudInfo,
      functions,
      groups,
    } = hostingYml;

    // Handle group deployment
    if (process.argv.includes('group')) {
      if (!groups || Object.keys(groups).length === 0) {
        console.log('No groups defined in .hosting.yml');
        return;
      }

      const groupNames = Object.keys(groups);
      const selectedGroupName = await interactiveChooseOption(
        'Which group would you like to deploy?',
        groupNames,
        { nameNode: null, valueNode: null }
      );

      console.log(`Deploying group: ${ selectedGroupName }`);
      
      const groupFunctions = groups[selectedGroupName];
      if (!Array.isArray(groupFunctions) || groupFunctions.length === 0) {
        console.log(`No functions found in group: ${ selectedGroupName }`);
        return;
      }

      // Deploy each function in the selected group
      for (const functionName of groupFunctions) {
        if (!functions[functionName]) {
          console.log(`Function ${ functionName } not found in functions config, skipping...`);
          continue;
        }

        console.log(`Deploying function: ${ functionName }`);
        await deployFunction(functionName, functions[functionName], gcloudInfo);
      }
      
      return;
    }

    // Handle individual function deployment
    if (process.argv.includes('function')) {
      if (!functions || Object.keys(functions).length === 0) {
        console.log('No functions defined in .hosting.yml');
        return;
      }

      const functionNames = Object.keys(functions);
      const selectedFunctionName = await interactiveChooseOption(
        'Which function would you like to deploy?',
        functionNames,
        { nameNode: null, valueNode: null }
      );

      console.log(`Deploying function: ${ selectedFunctionName }`);
      await deployFunction(selectedFunctionName, functions[selectedFunctionName], gcloudInfo);
      
      return;
    }

    if (process.argv.includes('all')) {
      for (const [functionName, functionConfig] of Object.entries(functions)) {
        console.log(functionName, functionConfig);
        await deployFunction(functionName, functionConfig, gcloudInfo);
      }
    }
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
})();

// Helper function to deploy a single function
async function deployFunction(functionName, functionConfig, gcloudInfo) {
  const config = {
    ...gcloudInfo,
    ...functionConfig,
  };
  console.log(config);

  const {
    // Native gcloud args
    project,
    region,
    trigger = 'http',
    runtime = 'nodejs20',
    allowUnauthenticated = true,
    gen2 = true,
    keep, // TODO: Remove this and refactor .hosting.yml to allow empty configs
    
    // Custom config properties
    schedules,
    
    // Unstated gcloud args
    ...miscCommandArgs
  } = config;

  const deployCommand = [
    `gcloud functions deploy ${ functionName }`,
    `--project ${ project }`,
    `--region ${ region }`,
    `--trigger-${ trigger }`,
    `--runtime ${ runtime }`,
    ...(allowUnauthenticated ? ['--allow-unauthenticated'] : []),
    ...(gen2 ? ['--gen2'] : []),
    ...Object.entries(miscCommandArgs).map(([key, value]) => `--${ key.replaceAll('_', '-') } ${ value }`),
  ].join(' ');

  console.log(deployCommand);
  try {
    await execCommand(deployCommand);
  } catch (error) {
    console.error(`Error deploying function ${ functionName }:`, error);
    return; // Skip to next function if deployment fails
  }

  // After deploying the function, create scheduled jobs
  if (schedules?.length) {
    for (const schedule of schedules) {
      
      let {
        name: jobName,
        schedule: jobSchedule,
        http_method: jobHttpMethod = 'POST',
        headers: jobHeaders = '',
        message_body: jobMessageBody,
        ...miscSchedulerArgs
      } = schedule;
      
      if (jobHeaders) {
        jobHeaders += ',';
      }
      jobHeaders += `x-api-key=${ process.env.HOSTED_API_KEY }`;

      try {
        // Check if job exists first
        const checkCommand = `gcloud scheduler jobs describe ${ jobName } --project=${ project } --location=${ region } 2>/dev/null || echo "NOT_FOUND"`;
        const checkResult = await execCommand(checkCommand);
        const jobExists = !checkResult.stdout.includes('NOT_FOUND');
        
        let schedulerCommand;
        if (jobExists) {
          // Update existing job
          schedulerCommand = [
            `gcloud scheduler jobs update http ${ jobName }`,
            `--schedule="${ jobSchedule }"`,
            `--uri="https://${ region }-${ project }.cloudfunctions.net/${ functionName }"`,
            `--http-method=${ jobHttpMethod }`,
            `--project=${ project }`,
            `--location=${ region }`,
            // TODO: Consider calculating headers to remove if necessary
            `--update-headers ${ jobHeaders }`,
            ...(jobMessageBody ? [`--message-body '${ jobMessageBody }'`] : []),
            ...Object.entries(miscSchedulerArgs).map(([key, value]) => `--${ key.replaceAll('_', '-') } ${ value }`),
          ].join(' ');
        } else {
          // Create new job
          schedulerCommand = [
            `gcloud scheduler jobs create http ${ jobName }`,
            `--schedule="${ jobSchedule }"`,
            `--uri="https://${ region }-${ project }.cloudfunctions.net/${ functionName }"`,
            `--http-method=${ jobHttpMethod }`,
            `--project=${ project }`,
            `--location=${ region }`,
            `--headers ${ jobHeaders }`,
            ...(jobMessageBody ? [`--message-body '${ jobMessageBody }'`] : []),
            ...Object.entries(miscSchedulerArgs).map(([key, value]) => `--${ key.replaceAll('_', '-') } ${ value }`),
          ].join(' ');
        }

        console.log(schedulerCommand);
        await execCommand(schedulerCommand);
      } catch (error) {
        console.error(`Error handling scheduler job ${ jobName }:`, error);
      }
    }
  }
}