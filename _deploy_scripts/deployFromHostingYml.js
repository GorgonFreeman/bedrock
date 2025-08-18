const { readFileYaml } = require('../utils');

(async() => {
  const hostingYml = await readFileYaml('.hosting.yml');
  console.log(hostingYml);
})();