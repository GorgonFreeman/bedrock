const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaPuppeteerOpen,
  asanaProjectUrlFromViewUrl,
  asanaProjectViewTabResolve,
  asanaProjectViewTabClick,
  asanaViewIdFromUrl,
} = require('../asana/asana.puppeteer.utils');

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

  const projectUrl = asanaProjectUrlFromViewUrl(viewUrl) || viewUrl;

  const openResponse = await asanaPuppeteerOpen(projectUrl, {
    headless,
    userDataDir,
  });

  if (!openResponse.success) {
    return openResponse;
  }

  const { page } = openResponse;

  !HOSTED && logDeep('asanaViewRename projectUrl', projectUrl);
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

  // TODO: rename the selected view tab to viewName

  return {
    success: true,
    result: {
      step: 'view_tab_selected',
      projectUrl,
      viewUrl: viewUrlAfterClick,
      viewId: asanaViewIdFromUrl(viewUrlAfterClick),
      viewIdentifier,
      viewName,
      tab,
    },
  };
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
