const { readFileYaml } = require('../utils');

(async() => {
  const hostingYml = await readFileYaml('.hosting.yml');
  console.log(hostingYml);

  const { 
    google_cloud_info: gcloudInfo,
    functions,
    groups,
  } = hostingYml;

  const {
    project,
    region,
    trigger = 'http',
    runtime = 'nodejs20',
    allowUnauthenticated = true,
  } = gcloudInfo;

  if (process.argv.includes('all')) {
    for (const [functionName, functionConfig] of Object.entries(functions)) {
      console.log(functionName, functionConfig);

      const deployCommand = `gcloud functions deploy ${ functionName } --project ${ project } --region ${ region } --trigger-${ trigger } --runtime ${ runtime } ${ allowUnauthenticated ? '--allow-unauthenticated' : '' }`;
      console.log(deployCommand);
    }
  }
})();