const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaPuppeteerOpen,
  asanaProjectViewTabResolve,
  asanaProjectViewTabClick,
  asanaViewIdFromUrl,
  ASANA_VISIBLE_VIEW_TAB_SELECTOR,
} = require('../asana/asana.puppeteer.utils');

const ASANA_VIEW_RENAME_INPUT_SELECTOR = '.ObjectTabNavigationBarItemWithMenu-nameInput';

const asanaViewRename = async (
  viewUrl,
  viewIdentifier,
  viewName,
  {
    onPage = false,
    page,
    headless = false,
    userDataDir,
  } = {},
) => {

  const localOnlyResponse = asanaPuppeteerLocalOnly();
  if (localOnlyResponse) {
    return localOnlyResponse;
  }

  let browser;
  let activePage = page;

  if (onPage) {
    if (!page) {
      return {
        success: false,
        error: ['onPage requires a page'],
      };
    }
  } else {
    const openResponse = await asanaPuppeteerOpen(viewUrl, {
      headless,
      userDataDir,
    });

    if (!openResponse.success) {
      return openResponse;
    }

    browser = openResponse.browser;
    activePage = openResponse.page;
  }

  try {
    !HOSTED && logDeep('asanaViewRename viewUrl', viewUrl);
    !HOSTED && logDeep('asanaViewRename viewIdentifier', viewIdentifier);

    let tab;

    if (onPage) {
      tab = await activePage.$$eval(
        ASANA_VISIBLE_VIEW_TAB_SELECTOR,
        tabs => {
          const index = tabs.findIndex(tabElement => tabElement.getAttribute('aria-selected') === 'true');

          if (index < 0) {
            return null;
          }

          const tabElement = tabs[index];

          return {
            index,
            title: (
              tabElement.querySelector('.ObjectTabNavigationBarItemWithMenu-bodyText')?.textContent?.trim()
              || tabElement.getAttribute('aria-label')
              || ''
            ),
            isSelected: true,
          };
        },
      );

      if (!tab) {
        return {
          success: false,
          error: ['Selected view tab not found'],
        };
      }

      tab.viewId = asanaViewIdFromUrl(activePage.url());

      await activePage.$$eval(
        ASANA_VISIBLE_VIEW_TAB_SELECTOR,
        (tabs, index) => tabs[index]?.click(),
        tab.index,
      );
    } else {
      const tabResolveResponse = await asanaProjectViewTabResolve(activePage, viewIdentifier);

      if (!tabResolveResponse.success) {
        return tabResolveResponse;
      }

      tab = tabResolveResponse.tab;

      await asanaProjectViewTabClick(activePage, tab.index);
    }

    await activePage.waitForFunction(
      () => [...document.querySelectorAll('[role="menuitem"]')].some(menuItem => (
        menuItem.querySelector('.MenuItemThemeablePresentation-main')?.textContent?.trim() === 'Rename'
        || menuItem.textContent?.trim() === 'Rename'
      )),
      { timeout: 10000 },
    );

    const renameMenuItemClicked = await activePage.$$eval(
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

    await activePage.waitForFunction(
      () => {
        const activeElement = document.activeElement;

        return activeElement?.tagName === 'INPUT'
          && activeElement.classList.contains('ObjectTabNavigationBarItemWithMenu-nameInput');
      },
      { timeout: 10000 },
    );

    await activePage.evaluate(() => {
      const activeElement = document.activeElement;

      if (activeElement?.tagName === 'INPUT') {
        activeElement.select();
      }
    });

    await activePage.keyboard.press('Backspace');
    await activePage.keyboard.type(viewName);
    await activePage.keyboard.press('Enter');

    await activePage.waitForFunction(
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

    const viewUrlAfterRename = activePage.url();

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
    if (browser) {
      await browser.close();
    }
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
