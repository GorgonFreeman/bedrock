const { HOSTED } = require('../constants');
const { funcApi, logDeep, objHasAny } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaPuppeteerOpen,
  asanaProjectUrl,
  asanaProjectViewTabResolve,
  asanaProjectViewTabClick,
  asanaViewIdFromUrl,
  ASANA_VISIBLE_VIEW_TAB_SELECTOR,
} = require('../asana/asana.puppeteer.utils');

const ASANA_VIEW_RENAME_INPUT_SELECTOR = '.ObjectTabNavigationBarItemWithMenu-nameInput';

const isValidViewIdentifier = viewIdentifier => {
  if (!viewIdentifier) {
    return false;
  }

  if (viewIdentifier.viewUrl) {
    return !viewIdentifier.projectIdentifier
      && !viewIdentifier.viewName
      && !viewIdentifier.viewId
      && !viewIdentifier.workspaceIdentifier;
  }

  if (!objHasAny(viewIdentifier.projectIdentifier, ['projectId', 'projectHandle'])) {
    return false;
  }

  if (!objHasAny(viewIdentifier.workspaceIdentifier, ['workspaceId', 'workspaceHandle'])) {
    return false;
  }

  const hasViewName = Boolean(viewIdentifier.viewName);
  const hasViewId = Boolean(viewIdentifier.viewId);

  return (hasViewName || hasViewId) && !(hasViewName && hasViewId);
};

const resolveViewIdentifier = viewIdentifier => {
  if (viewIdentifier.viewUrl) {
    return {
      success: true,
      openUrl: viewIdentifier.viewUrl,
      useSelectedTab: true,
    };
  }

  const openUrl = asanaProjectUrl(
    viewIdentifier.projectIdentifier,
    viewIdentifier.workspaceIdentifier,
  );

  if (!openUrl) {
    return {
      success: false,
      error: [`Couldn't get a project URL from viewIdentifier.projectIdentifier and viewIdentifier.workspaceIdentifier`],
    };
  }

  if (viewIdentifier.viewId) {
    return {
      success: true,
      openUrl,
      tabLookup: String(viewIdentifier.viewId),
    };
  }

  return {
    success: true,
    openUrl,
    tabLookup: viewIdentifier.viewName,
  };
};

const asanaProjectViewSelectedTabGet = async page => {
  const tab = await page.$$eval(
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

  return {
    success: true,
    tab: {
      ...tab,
      viewId: asanaViewIdFromUrl(page.url()),
    },
  };
};

const asanaViewRename = async (
  viewIdentifier,
  name,
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

  if (!isValidViewIdentifier(viewIdentifier)) {
    return {
      success: false,
      error: [
        'viewIdentifier must be { viewUrl } or { projectIdentifier, workspaceIdentifier, viewName } or { projectIdentifier, workspaceIdentifier, viewId }',
      ],
    };
  }

  const viewIdentifierResolution = resolveViewIdentifier(viewIdentifier);

  if (!viewIdentifierResolution.success) {
    return viewIdentifierResolution;
  }

  const { openUrl, useSelectedTab, tabLookup } = viewIdentifierResolution;

  let browser;
  let activePage = page;

  if (onPage) {
    if (!page) {
      return {
        success: false,
        error: ['onPage requires a page'],
      };
    }

    if (!useSelectedTab) {
      return {
        success: false,
        error: ['onPage requires viewIdentifier.viewUrl'],
      };
    }
  } else {
    const openResponse = await asanaPuppeteerOpen(openUrl, {
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
    !HOSTED && logDeep('asanaViewRename viewIdentifier', viewIdentifier);
    !HOSTED && logDeep('asanaViewRename name', name);

    let tab;

    if (useSelectedTab) {
      const selectedTabResponse = await asanaProjectViewSelectedTabGet(activePage);

      if (!selectedTabResponse.success) {
        return selectedTabResponse;
      }

      tab = selectedTabResponse.tab;

      const viewIdFromUrl = asanaViewIdFromUrl(openUrl);

      if (viewIdFromUrl && tab.viewId !== viewIdFromUrl) {
        return {
          success: false,
          error: [`Selected tab viewId "${ tab.viewId }" does not match viewUrl viewId "${ viewIdFromUrl }"`],
          tab,
        };
      }

      await activePage.$$eval(
        ASANA_VISIBLE_VIEW_TAB_SELECTOR,
        (tabs, index) => tabs[index]?.click(),
        tab.index,
      );
    } else {
      const tabResolveResponse = await asanaProjectViewTabResolve(activePage, tabLookup);

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
    await activePage.keyboard.type(name);
    await activePage.keyboard.press('Enter');

    await activePage.waitForFunction(
      (renameInputSelector, expectedName) => {
        const selectedTabTitle = document.querySelector(
          '[data-dd-action-name="project-view-tab"][aria-hidden="false"][aria-selected="true"] .ObjectTabNavigationBarItemWithMenu-bodyText',
        )?.textContent?.trim();

        return selectedTabTitle === expectedName
          && !document.querySelector(renameInputSelector);
      },
      { timeout: 10000 },
      ASANA_VIEW_RENAME_INPUT_SELECTOR,
      name,
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
        name,
        tab: {
          ...tab,
          title: name,
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
  argNames: ['viewIdentifier', 'name', 'options'],
  validatorsByArg: {
    viewIdentifier: isValidViewIdentifier,
    name: Boolean,
  },
});

module.exports = {
  asanaViewRename,
  asanaViewRenameApi,
};

/*
curl localhost:8000/asanaViewRename \
  -H "Content-Type: application/json" \
  -d '{
    "viewIdentifier": {
      "viewUrl": "https://app.asana.com/1/764221262452024/project/1208942389126559/board/1215269395794915"
    },
    "name": "I wanna be"
  }'

curl localhost:8000/asanaViewRename \
  -H "Content-Type: application/json" \
  -d '{
    "viewIdentifier": {
      "workspaceIdentifier": { "workspaceHandle": "wf" },
      "projectIdentifier": { "projectHandle": "dev" },
      "viewId": "1215269395794915"
    },
    "name": "in the room"
  }'

curl localhost:8000/asanaViewRename \
  -H "Content-Type: application/json" \
  -d '{
    "viewIdentifier": {
      "workspaceIdentifier": { "workspaceHandle": "wf" },
      "projectIdentifier": { "projectHandle": "dev" },
      "viewName": "in the room"
    },
    "name": "where it happens"
  }'
*/
