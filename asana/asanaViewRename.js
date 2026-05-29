const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaPuppeteerOpen,
} = require('../asana/asana.puppeteer.utils');

const asanaViewRename = async (
  viewUrl,
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

  !HOSTED && logDeep('asanaViewRename viewUrl', viewUrl);

  // TODO: rename the active view tab to viewName

  return {
    success: true,
    result: {
      step: 'view_rename_pending',
      viewUrl,
      viewName,
    },
  };
};

const asanaViewRenameApi = funcApi(asanaViewRename, {
  argNames: ['viewUrl', 'viewName', 'options'],
  validatorsByArg: {
    viewUrl: Boolean,
    viewName: Boolean,
  },
});

module.exports = {
  asanaViewRename,
  asanaViewRenameApi,
};

// curl localhost:8000/asanaViewRename -H "Content-Type: application/json" -d '{ "viewUrl": "https://app.asana.com/1/764221262452024/project/1208942389126559/board/1215241286725636", "viewName": "Epic: Freeze Ray Development" }'
