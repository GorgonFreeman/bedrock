const { readFileYaml } = require('../utils');
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
        try {
          await execCommand(deployCommand);
        } catch (error) {
          console.error(`Error deploying function ${ functionName }:`, error);
          continue; // Skip to next function if deployment fails
        }

        // After deploying the function, create scheduled jobs
        if (schedules?.length) {
          for (const schedule of schedules) {
            
            const {
              name: jobName,
              schedule: jobSchedule,
              ...miscSchedulerArgs
            } = schedule;

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
                  `--http-method=POST`,
                  `--project=${ project }`,
                  `--location=${ region }`,
                  ...Object.entries(miscSchedulerArgs).map(([key, value]) => `--${ key.replaceAll('_', '-') } ${ value }`),
                ].join(' ');
              } else {
                // Create new job
                schedulerCommand = [
                  `gcloud scheduler jobs create http ${ jobName }`,
                  `--schedule="${ jobSchedule }"`,
                  `--uri="https://${ region }-${ project }.cloudfunctions.net/${ functionName }"`,
                  `--http-method=POST`,
                  `--project=${ project }`,
                  `--location=${ region }`,
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
    }
  } catch (error) {
    console.error('Script error:', error);
    process.exit(1);
  }
})();