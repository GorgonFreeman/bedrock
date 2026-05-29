const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaPuppeteerOpen,
} = require('../asana/asana.puppeteer.utils');

const asanaViewFilterApply = async (
  viewUrl,
  filters,
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

  !HOSTED && logDeep('asanaViewFilterApply viewUrl', viewUrl);
  !HOSTED && logDeep('asanaViewFilterApply filters', filters);

  // TODO: apply filters and save the view

  return {
    success: true,
    result: {
      step: 'view_filter_apply_pending',
      viewUrl,
      filters,
    },
  };
};

const asanaViewFilterApplyApi = funcApi(asanaViewFilterApply, {
  argNames: ['viewUrl', 'filters', 'options'],
  validatorsByArg: {
    viewUrl: Boolean,
    filters: Boolean,
  },
});

module.exports = {
  asanaViewFilterApply,
  asanaViewFilterApplyApi,
};

// curl localhost:8000/asanaViewFilterApply -H "Content-Type: application/json" -d '{ "viewUrl": "https://app.asana.com/1/764221262452024/project/1208942389126559/board/1215241286725636", "filters": { "customFieldName": "Epic", "customFieldValue": "Freeze Ray Development" } }'
