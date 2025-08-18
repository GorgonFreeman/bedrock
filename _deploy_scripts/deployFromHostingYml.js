const { readFileYaml } = require('../utils');

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
    }
  }
})();