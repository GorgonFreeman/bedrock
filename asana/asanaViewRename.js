const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaPuppeteerOpen,
  asanaProjectViewTabResolve,
  asanaProjectViewTabClick,
  asanaViewIdFromUrl,
} = require('../asana/asana.puppeteer.utils');

const ASANA_VIEW_RENAME_INPUT_SELECTOR = '.ObjectTabNavigationBarItemWithMenu-nameInput';

const asanaViewRename = async (
  viewUrl,
  viewIdentifier,
  viewName,
  {
    headless = false,
    userDataDir,
  } = {},
) => {

  const localOnlyResponse = asanaPuppeteerLocalOnly();
  if (localOnlyResponse) {
    return localOnlyResponse;
  }

  const openResponse = await asanaPuppeteerOpen(viewUrl, {
    headless,
    userDataDir,
  });

  if (!openResponse.success) {
    return openResponse;
  }

  const { page, browser } = openResponse;

  try {
    !HOSTED && logDeep('asanaViewRename viewUrl', viewUrl);
    !HOSTED && logDeep('asanaViewRename viewIdentifier', viewIdentifier);

    const tabResolveResponse = await asanaProjectViewTabResolve(page, viewIdentifier);

    if (!tabResolveResponse.success) {
      return tabResolveResponse;
    }

    const { tab } = tabResolveResponse;

    await asanaProjectViewTabClick(page, tab.index);

    const viewUrlAfterClick = page.url();

    !HOSTED && logDeep('asanaViewRename tab', tab);
    !HOSTED && logDeep('asanaViewRename viewUrlAfterClick', viewUrlAfterClick);

    await page.waitForSelector('[role="menu"]', {
      visible: true,
    });

    const renameMenuItemClicked = await page.$$eval(
      '[role="menuitem"]',
      menuItems => {
        const renameMenuItem = menuItems.find(menuItem => (
          menuItem.querySelector('.MenuItemThemeablePresentation-main')?.textContent?.trim() === 'Rename'
          || menuItem.textContent?.trim() === 'Rename'
        ));

        if (!renameMenuItem) {
          return false;
        }

        renameMenuItem.click();
        return true;
      },
    );

    if (!renameMenuItemClicked) {
      return {
        success: false,
        error: ['Rename menu item not found'],
      };
    }

    await page.waitForFunction(
      () => {
        const activeElement = document.activeElement;

        return activeElement?.tagName === 'INPUT'
          && activeElement.classList.contains('ObjectTabNavigationBarItemWithMenu-nameInput');
      },
      { timeout: 10000 },
    );

    await page.evaluate(() => {
      const activeElement = document.activeElement;

      if (activeElement?.tagName === 'INPUT') {
        activeElement.select();
      }
    });

    await page.keyboard.press('Backspace');
    await page.keyboard.type(viewName);
    await page.keyboard.press('Enter');

    await page.waitForFunction(
      (renameInputSelector, expectedViewName) => {
        const selectedTabTitle = document.querySelector(
          '[data-dd-action-name="project-view-tab"][aria-hidden="false"][aria-selected="true"] .ObjectTabNavigationBarItemWithMenu-bodyText',
        )?.textContent?.trim();

        return selectedTabTitle === expectedViewName
          && !document.querySelector(renameInputSelector);
      },
      { timeout: 10000 },
      ASANA_VIEW_RENAME_INPUT_SELECTOR,
      viewName,
    );

    const viewUrlAfterRename = page.url();

    !HOSTED && logDeep('asanaViewRename viewUrlAfterRename', viewUrlAfterRename);

    return {
      success: true,
      result: {
        step: 'view_renamed',
        viewUrl: viewUrlAfterRename,
        viewId: asanaViewIdFromUrl(viewUrlAfterRename),
        viewIdentifier,
        viewName,
        tab: {
          ...tab,
          title: viewName,
        },
      },
    };
  } finally {
    await browser.close();
  }
};

const asanaViewRenameApi = funcApi(asanaViewRename, {
  argNames: ['viewUrl', 'viewIdentifier', 'viewName', 'options'],
  validatorsByArg: {
    viewUrl: Boolean,
    viewIdentifier: Boolean,
    viewName: Boolean,
  },
});

module.exports = {
  asanaViewRename,
  asanaViewRenameApi,
};

// curl localhost:8000/asanaViewRename -H "Content-Type: application/json" -d '{ "viewUrl": "https://app.asana.com/1/764221262452024/project/1208942389126559/board/1215241286725636", "viewIdentifier": "1215241286725636", "viewName": "Epic: Freeze Ray Development" }'
// curl localhost:8000/asanaViewRename -H "Content-Type: application/json" -d '{ "viewUrl": "https://app.asana.com/1/764221262452024/project/1208942389126559/board/1215241286725636", "viewIdentifier": "Board", "viewName": "Epic: Freeze Ray Development" }'
