const { spawn } = require('child_process');

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const childProcess = spawn(cmd, args, { stdio: 'pipe', shell: true });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('stdout:', data.toString());
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.warn('stderr:', data.toString());
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, command });
      } else {
        reject({ stdout, stderr, command, code });
      }
    });
    
    childProcess.on('error', (error) => {
      reject({ error, command });
    });
  });
};

module.exports = {
  execCommand,
};
