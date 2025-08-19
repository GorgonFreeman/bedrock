const { readFileYaml } = require('../utils');
const { execCommand } = require('./execCommand');

(async() => {
  const hostingYml = await readFileYaml('.hosting.yml');
  console.log(hostingYml);

  const { 
    google_cloud_info: gcloudInfo,
    functions,
    groups,
  } = hostingYml;

  if (process.argv.includes('all')) {
    for (const [functionName, functionConfig] of Object.entries(functions)) {
      console.log(functionName, functionConfig);

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
      execCommand(deployCommand);

      // After deploying the function, create scheduled jobs
      if (schedules?.length) {
        for (const schedule of schedules) {
          
          const {
            name: jobName,
            schedule: jobSchedule,
            ...miscSchedulerArgs
          } = schedule;

          const schedulerCommand = [
            `gcloud scheduler jobs create http ${ jobName }`,
            `--schedule="${ jobSchedule }"`,
            `--uri="https://${ region }-${ project }.cloudfunctions.net/${ functionName }"`,
            `--http-method=POST`,
            `--project=${ project }`,
            `--location=${ region }`,
            ...Object.entries(miscSchedulerArgs).map(([key, value]) => `--${ key.replaceAll('_', '-') } ${ value }`),
          ].join(' ');

          console.log(schedulerCommand);
          execCommand(schedulerCommand);
        }
      }
    }
  }
})();