const { HOSTED } = require('../constants');
const { funcApi, askQuestion, logDeep, objHasAny } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaProjectUrl,
  asanaPuppeteerLaunch,
} = require('../asana/asana.puppeteer.utils');

const asanaViewCreate = async (
  projectIdentifier,
  viewType,
  viewName,
  {
    workspaceIdentifier = { workspaceHandle: 'wf' },
    interactive = true,
    headless = false,
    userDataDir,
  } = {},
) => {

  const localOnlyResponse = asanaPuppeteerLocalOnly();
  if (localOnlyResponse) {
    return localOnlyResponse;
  }

  const projectUrl = asanaProjectUrl(projectIdentifier, workspaceIdentifier);

  if (!projectUrl) {
    return {
      success: false,
      error: [`Couldn't get a project URL from projectIdentifier and workspaceIdentifier`],
    };
  }

  const { page } = await asanaPuppeteerLaunch({
    headless,
    userDataDir,
  });

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

  await page.waitForFunction(
    () => /\/project\/\d+\/\w+\/\d+/.test(window.location.pathname),
    { timeout: 30000 },
  );

  const viewUrl = page.url();

  !HOSTED && logDeep('asanaViewCreate viewUrl', viewUrl);

  if (interactive) {
    await askQuestion(`Step 3: created ${ viewType } view at ${ viewUrl }. Press enter when ready for the next step...`);
  }

  return { 
    success: true,
    result: {
      step: 'view_created',
      projectUrl,
      viewUrl,
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
};

// curl localhost:8000/asanaViewCreate -H "Content-Type: application/json" -d '{ "projectIdentifier": { "projectHandle": "dev" }, "viewType": "board", "viewName": "Freeze Ray Development" }'
