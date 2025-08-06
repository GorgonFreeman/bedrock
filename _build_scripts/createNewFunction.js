const { askQuestion, capitaliseString } = require('../utils');
const fs = require('fs').promises;
const { exec, spawn } = require('child_process');

const excludedDirs = ['node_modules'];

const gitCommitAll = (message) => {
  console.log('Committing in background (2 second delay)...');
  
  // Run the commit in a detached process
  const commitProcess = spawn('sh', ['-c', `sleep 2 && git add . && git commit -m '${ message }'`], {
    detached: true,
    stdio: 'ignore',
  });
  
  // Unref the process so it doesn't keep the parent alive
  commitProcess.unref();
};

const findExampleFiles = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    const exampleFiles = files.filter(file => file.startsWith('_example'));
    
    return exampleFiles.map(file => {
      const match = file.match(/^_example(?:\.(.+))?\.js$/);
      if (match) {
        return {
          filename: file,
          displayName: match[1] || '_example.js',
          fullPath: `${ dirPath }/${ file }`,
        };
      }
      return null;
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
};

const scriptFileContents = async (name, path, selectedTemplate) => {
  let exampleFileContents;
  
  if (selectedTemplate) {
    // Use the selected template file
    exampleFileContents = await fs.readFile(selectedTemplate, 'utf-8');
  } else {
    // Fallback to original logic
    try {
      exampleFileContents = await fs.readFile(`./${ path }_example.js`, 'utf-8');  
    } catch(err) {
      console.warn('Falling back to default _example.js');
      exampleFileContents = await fs.readFile(`./_example.js`, 'utf-8');
    }
  }
  
  return exampleFileContents.replace(/FUNC/g, name);
};

const getDirs = async () => {
  const dirents = await fs.readdir('./', { withFileTypes: true });
  const topLevelFolders = dirents
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => (name[0] !== '_' && name[0] !== '.'))
    .filter(name => !excludedDirs.includes(name));
  return topLevelFolders;
};

const createNewFunction = async () => {
  const dirs = await getDirs();

  const dirIndex = await askQuestion(`Where does your new function live? \n${
    dirs.map((dir, index) => {
      return `[${ index + 1 }] ${ dir }`;
    }).join('\n')
  }\n`);
  const dir = dirs[dirIndex - 1];

  if (!dir) {
    console.error(`${ dirIndex } not a valid option.`);
    return;
  }

  // Find available example files in the selected directory
  const exampleFiles = await findExampleFiles(dir);
  let selectedTemplate = null;

  if (exampleFiles.length > 0) {
    // Sort to ensure _example.js is always first
    exampleFiles.sort((a, b) => {
      if (a.displayName === '_example.js') return -1;
      if (b.displayName === '_example.js') return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    console.log(`\nFound ${ exampleFiles.length } template(s) in ${ dir }:`);
    const templateIndex = await askQuestion(`Which template would you like to use? (press enter for _example.js) \n${
      exampleFiles.map((file, index) => {
        return `[${ index + 1 }] ${ file.displayName }`;
      }).join('\n')
    }\n`);
    
    let selectedFile;
    if (!templateIndex || templateIndex.trim() === '') {
      // User pressed enter, use _example.js
      selectedFile = exampleFiles.find(file => file.displayName === '_example.js');
      if (!selectedFile) {
        console.error('No _example.js template found.');
        return;
      }
    } else {
      selectedFile = exampleFiles[templateIndex - 1];
    }
    
    if (selectedFile) {
      selectedTemplate = selectedFile.fullPath;
    } else {
      console.error(`${ templateIndex } not a valid option.`);
      return;
    }
  }

  const name = await askQuestion(`What do you want to call it? ${ dir }`);

  if (!name) {
    console.error('Error getting script name');
    return;
  }

  try {
    const funcName = dir ? `${ dir }${ capitaliseString(name) }` : name;
    const pathName = dir ? `${ dir }/` : '';

    const script = await scriptFileContents(funcName, pathName, selectedTemplate);
    await fs.writeFile(`${ pathName }${ funcName }.js`, script);

    // Only commit if 'commit' is present in argv
    if (process.argv.includes('commit')) {
      gitCommitAll(`${ funcName } stub`);
    }
  } catch(err) {
    console.error(err);
  }
};

createNewFunction();