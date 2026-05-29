const puppeteer = require('puppeteer');

const { HOSTED } = require('../constants');
const { funcApi, askQuestion, logDeep, objHasAny } = require('../utils');
const { resolveProjectId, resolveWorkspaceId } = require('../asana/asana.utils');

const ASANA_USER_DATA_DIR = `${ __dirname }/.asana-puppeteer-profile`;

const asanaProjectUrl = (
  projectIdentifier,
  workspaceIdentifier = { workspaceHandle: 'wf' },
) => {
  const projectId = resolveProjectId(projectIdentifier);
  const workspaceId = resolveWorkspaceId(workspaceIdentifier);

  if (!projectId || !workspaceId) {
    return null;
  }

  return `https://app.asana.com/1/${ workspaceId }/project/${ projectId }`;
};

const asanaViewCreate = async (
  projectIdentifier,
  viewType,
  viewName,
  {
    workspaceIdentifier = { workspaceHandle: 'wf' },
    interactive = true,
    headless = false,
    userDataDir = ASANA_USER_DATA_DIR,
  } = {},
) => {

  if (HOSTED) {
    return {
      success: false,
      error: ['Puppeteer view creation can only be done locally'],
    };
  }

  const projectUrl = asanaProjectUrl(projectIdentifier, workspaceIdentifier);

  if (!projectUrl) {
    return {
      success: false,
      error: [`Couldn't get a project URL from projectIdentifier and workspaceIdentifier`],
    };
  }

  const browser = await puppeteer.launch({
    headless,
    userDataDir,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.goto(projectUrl, {
    waitUntil: 'networkidle2',
  });

  !HOSTED && logDeep('asanaViewCreate projectUrl', projectUrl);

  if (interactive) {
    await askQuestion(`Step 1: opened ${ projectUrl }. Press enter when ready for the next step...`);
  }

  const addTabSelector = '[aria-label="Add tab"]';

  await page.waitForSelector(addTabSelector, {
    visible: true,
  });

  await page.click(addTabSelector);

  !HOSTED && logDeep('asanaViewCreate addTabSelector', addTabSelector);

  if (interactive) {
    await askQuestion('Step 2: clicked Add tab (+). Press enter when ready for the next step...');
  }

  const viewTypeDialogSelector = '.CustomTabNavigationBar-customTabCreationMenuDialog';
  const viewTypeLower = viewType.toLowerCase();

  await page.waitForSelector(viewTypeDialogSelector, {
    visible: true,
  });

  const viewTypeInputValue = await page.$$eval(
    `${ viewTypeDialogSelector } input[type="checkbox"]`,
    (inputs, targetViewTypeLower) => (
      inputs.find(input => input.value.toLowerCase() === targetViewTypeLower)?.value ?? null
    ),
    viewTypeLower,
  );

  if (!viewTypeInputValue) {
    return {
      success: false,
      error: [`View type "${ viewType }" not found in tab picker`],
    };
  }

  const viewTypeSelector = `${ viewTypeDialogSelector } input[type="checkbox"][value="${ viewTypeInputValue }"]`;

  await page.click(viewTypeSelector);

  !HOSTED && logDeep('asanaViewCreate viewTypeSelector', viewTypeSelector);

  if (interactive) {
    await askQuestion(`Step 3: selected ${ viewType } view. Press enter when ready for the next step...`);
  }

  return { 
    success: true,
    result: {
      step: 'view_type_selected',
      projectUrl,
      viewType,
      viewName,
      viewTypeInputValue,
    },
  };
};

const asanaViewCreateApi = funcApi(asanaViewCreate, {
  argNames: [
    'projectIdentifier',
    'viewType',
    'viewName',
    'options',
  ],
  validatorsByArg: {
    projectIdentifier: p => objHasAny(p, ['projectId', 'projectHandle']),
    viewType: Boolean,
    viewName: Boolean,
  },
});

module.exports = {
  asanaViewCreate,
  asanaViewCreateApi,
  asanaProjectUrl,
};

// curl localhost:8000/asanaViewCreate -H "Content-Type: application/json" -d '{ "projectIdentifier": { "projectHandle": "dev" }, "viewType": "board", "viewName": "Freeze Ray Development" }'
