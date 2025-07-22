const chokidar = require('chokidar');
const { exec } = require('child_process');

const scriptsToRun = [
  'node _build_scripts/generateServable.js',
];

const watcher = chokidar.watch('./', {
  ignored: [
    /node_modules/, 
    /.git/,
    /_build_scripts/,
    /servable\.js/,
  ],
  persistent: true,
});

let running = false;
watcher
  .on('ready', () => {
    console.log('File watcher running. o7');
    running = true;
  })
  .on('add', (path) => {
    if (!running) {
      return;
    }
    console.log(`File ${ path } has been added`);
    runScripts(path);
  })
  .on('change', (path) => {
    if (!running) {
      return;
    }
    console.log(`File ${ path } has been changed`);
    runScripts(path);
  });

const runScripts = (path) => {

  const moreScriptsToRun = [];

  // console.log('path', path);
  if (path === '.creds.yml') {
    moreScriptsToRun.push('node _build_scripts/copyCredsToEnv');
  }

  const command = `conc ${ [ ...scriptsToRun, ...moreScriptsToRun ].map(script => `"${ script }"`).join(' ') }`;
  console.log(command);
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      console.error(`Error executing scripts: ${ stderr }`);
    } else {
      console.log(`Scripts output: ${ stdout }`);
    }
  });
};