const { HOSTED } = require('../constants');
const { funcApi, askQuestion, logDeep, objHasAny } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaProjectUrl,
  asanaPuppeteerLaunch,
  asanaViewIdFromUrl,
} = require('../asana/asana.puppeteer.utils');
const { asanaViewRename } = require('../asana/asanaViewRename');

const viewTypeDialogSelector = '.CustomTabNavigationBar-customTabCreationMenuDialog';

const asanaVisibleAddTabClick = async page => {
  await page.waitForFunction(
    () => [...document.querySelectorAll('[aria-label="Add tab"]')].some(addTab => (
      !addTab.closest('.ObjectCustomTabNavigationBarWithOverflow-measuringBox')
      && getComputedStyle(addTab).visibility === 'visible'
    )),
    { timeout: 30000 },
  );

  await page.evaluate(() => {
    const addTab = [...document.querySelectorAll('[aria-label="Add tab"]')].find(el => (
      !el.closest('.ObjectCustomTabNavigationBarWithOverflow-measuringBox')
      && getComputedStyle(el).visibility === 'visible'
    ));

    addTab?.click();
  });
};

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

  const { page, browser } = await asanaPuppeteerLaunch({
    headless,
    userDataDir,
  });

  try {
    await page.goto(projectUrl, {
      waitUntil: 'networkidle2',
    });

    !HOSTED && logDeep('asanaViewCreate projectUrl', projectUrl);

    if (interactive) {
      await askQuestion(`Step 1: opened ${ projectUrl }. Press enter when ready for the next step...`);
    }

    const addTabSelector = '[aria-label="Add tab"]';

    await asanaVisibleAddTabClick(page);

    !HOSTED && logDeep('asanaViewCreate addTabSelector', addTabSelector);

    if (interactive) {
      await askQuestion('Step 2: clicked Add tab (+). Press enter when ready for the next step...');
    }

    const viewTypeLower = viewType.toLowerCase();

    await page.waitForSelector(viewTypeDialogSelector);

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

    await page.evaluate(selector => document.querySelector(selector)?.click(), viewTypeSelector);

    await page.waitForFunction(
      () => /\/project\/\d+\/\w+\/\d+/.test(window.location.pathname),
      { timeout: 30000 },
    );

    await page.waitForFunction(
      selector => !document.querySelector(selector),
      { timeout: 10000 },
      viewTypeDialogSelector,
    );

    const viewUrl = page.url();
    const viewId = asanaViewIdFromUrl(viewUrl);

    !HOSTED && logDeep('asanaViewCreate viewUrl', viewUrl);

    if (interactive) {
      await askQuestion(`Step 3: created ${ viewType } view at ${ viewUrl }. Press enter when ready for the next step...`);
    }

    await page.waitForFunction(
      () => document.querySelector('[data-dd-action-name="project-view-tab"][aria-hidden="false"][aria-selected="true"]'),
      { timeout: 30000 },
    );

    if (interactive) {
      await askQuestion(`Step 4: renaming view to "${ viewName }". Press enter when ready for the next step...`);
    }

    const renameResponse = await asanaViewRename(viewUrl, viewId, viewName, {
      onPage: true,
      page,
    });

    if (!renameResponse.success) {
      return renameResponse;
    }

    !HOSTED && logDeep('asanaViewCreate renameResponse', renameResponse);

    return {
      success: true,
      result: {
        step: 'view_created_and_renamed',
        projectUrl,
        viewUrl: renameResponse.result.viewUrl,
        viewId: renameResponse.result.viewId,
        viewType,
        viewName,
        viewTypeInputValue,
        tab: renameResponse.result.tab,
      },
    };
  } finally {
    if (!interactive) {
      await browser.close();
    }
  }
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

// curl localhost:8000/asanaViewCreate -H "Content-Type: application/json" -d '{ "projectIdentifier": { "projectHandle": "dev" }, "viewType": "board", "viewName": "Epic: Freeze Ray Development", "options": { "interactive": false } }'
