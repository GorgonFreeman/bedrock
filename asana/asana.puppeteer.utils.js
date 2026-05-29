const puppeteer = require('puppeteer');

const { HOSTED } = require('../constants');
const { resolveProjectId, resolveWorkspaceId } = require('../asana/asana.utils');

const ASANA_USER_DATA_DIR = `${ __dirname }/.asana-puppeteer-profile`;

const asanaPuppeteerLocalOnly = () => {
  if (HOSTED) {
    return {
      success: false,
      error: ['Asana Puppeteer automation can only be done locally'],
    };
  }
};

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

const asanaPuppeteerLaunch = async ({
  headless = false,
  userDataDir = ASANA_USER_DATA_DIR,
} = {}) => {
  const browser = await puppeteer.launch({
    headless,
    userDataDir,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  return {
    browser,
    page,
  };
};

const ASANA_VIEW_TAB_SELECTOR = '[data-dd-action-name="project-view-tab"]';
const ASANA_VISIBLE_VIEW_TAB_SELECTOR = `${ ASANA_VIEW_TAB_SELECTOR }[aria-hidden="false"]`;

const asanaViewIdFromUrl = url => {
  const match = url.match(/\/project\/\d+\/\w+\/(\d+)/);
  return match ? match[1] : null;
};

const asanaProjectUrlFromViewUrl = url => {
  const match = url.match(/^(https:\/\/app\.asana\.com\/\d+\/\d+\/project\/\d+)/);
  return match ? match[1] : null;
};

const asanaProjectViewTabsGet = async page => {
  await page.waitForSelector(ASANA_VISIBLE_VIEW_TAB_SELECTOR);

  const tabCount = await page.$$eval(ASANA_VISIBLE_VIEW_TAB_SELECTOR, tabs => tabs.length);

  if (!tabCount) {
    return [];
  }

  const initialUrl = page.url();
  const tabs = [];

  for (let tabIndex = 0; tabIndex < tabCount; tabIndex++) {
    await page.$$eval(
      ASANA_VISIBLE_VIEW_TAB_SELECTOR,
      (tabElements, index) => tabElements[index].click(),
      tabIndex,
    );

    await page.waitForFunction(
      () => /\/project\/\d+\/\w+\/\d+/.test(window.location.pathname),
      { timeout: 30000 },
    );

    const tabInfo = await page.$$eval(
      ASANA_VISIBLE_VIEW_TAB_SELECTOR,
      (tabElements, index) => {
        const tab = tabElements[index];

        return {
          title: (
            tab.querySelector('.ObjectTabNavigationBarItemWithMenu-bodyText')?.textContent?.trim()
            || tab.getAttribute('aria-label')
            || ''
          ),
          isSelected: tab.getAttribute('aria-selected') === 'true',
        };
      },
      tabIndex,
    );

    tabs.push({
      ...tabInfo,
      index: tabIndex,
      viewId: asanaViewIdFromUrl(page.url()),
    });
  }

  if (initialUrl !== page.url()) {
    await page.goto(initialUrl, {
      waitUntil: 'networkidle2',
    });

    await page.waitForSelector(ASANA_VISIBLE_VIEW_TAB_SELECTOR);
  }

  return tabs;
};

const asanaProjectViewTabResolve = async (page, viewIdentifier) => {
  await page.waitForSelector(ASANA_VISIBLE_VIEW_TAB_SELECTOR);

  const viewIdentifierString = String(viewIdentifier);
  const isViewId = /^\d+$/.test(viewIdentifierString);
  const currentViewId = asanaViewIdFromUrl(page.url());

  if (isViewId && currentViewId === viewIdentifierString) {
    const selectedTab = await page.$$eval(
      ASANA_VISIBLE_VIEW_TAB_SELECTOR,
      tabs => {
        const index = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');

        if (index < 0) {
          return null;
        }

        const tab = tabs[index];

        return {
          index,
          title: (
            tab.querySelector('.ObjectTabNavigationBarItemWithMenu-bodyText')?.textContent?.trim()
            || tab.getAttribute('aria-label')
            || ''
          ),
          isSelected: true,
        };
      },
    );

    if (selectedTab) {
      return {
        success: true,
        tab: {
          ...selectedTab,
          viewId: currentViewId,
        },
      };
    }
  }

  const tabs = await asanaProjectViewTabsGet(page);

  if (isViewId) {
    const matchingTabs = tabs.filter(tab => tab.viewId === viewIdentifierString);

    if (!matchingTabs.length) {
      return {
        success: false,
        error: [`No view tab found with ID "${ viewIdentifierString }"`],
        tabs,
      };
    }

    return {
      success: true,
      tab: matchingTabs[0],
    };
  }

  const matchingTabs = tabs.filter(tab => tab.title === viewIdentifierString);

  if (!matchingTabs.length) {
    return {
      success: false,
      error: [`No view tab found with title "${ viewIdentifierString }"`],
      tabs,
    };
  }

  if (matchingTabs.length > 1) {
    return {
      success: false,
      error: [
        `Multiple view tabs found with title "${ viewIdentifierString }". Use view ID instead.`,
        ...matchingTabs.map(tab => `  ${ tab.title }: ${ tab.viewId }`),
      ],
      tabs: matchingTabs,
    };
  }

  return {
    success: true,
    tab: matchingTabs[0],
  };
};

const asanaProjectViewTabClick = async (page, tabIndex) => {
  await page.$$eval(
    ASANA_VISIBLE_VIEW_TAB_SELECTOR,
    (tabElements, index) => tabElements[index].click(),
    tabIndex,
  );

  await page.waitForFunction(
    () => /\/project\/\d+\/\w+\/\d+/.test(window.location.pathname),
    { timeout: 30000 },
  );
};

const asanaPuppeteerOpen = async (
  url,
  {
    headless = false,
    userDataDir = ASANA_USER_DATA_DIR,
    waitUntil = 'networkidle2',
  } = {},
) => {
  const localOnlyResponse = asanaPuppeteerLocalOnly();
  if (localOnlyResponse) {
    return localOnlyResponse;
  }

  const { browser, page } = await asanaPuppeteerLaunch({
    headless,
    userDataDir,
  });

  await page.goto(url, {
    waitUntil,
  });

  return {
    success: true,
    browser,
    page,
  };
};

module.exports = {
  ASANA_USER_DATA_DIR,
  ASANA_VIEW_TAB_SELECTOR,
  ASANA_VISIBLE_VIEW_TAB_SELECTOR,
  asanaPuppeteerLocalOnly,
  asanaProjectUrl,
  asanaViewIdFromUrl,
  asanaProjectUrlFromViewUrl,
  asanaProjectViewTabsGet,
  asanaProjectViewTabResolve,
  asanaProjectViewTabClick,
  asanaPuppeteerLaunch,
  asanaPuppeteerOpen,
};
