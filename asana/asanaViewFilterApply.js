const { HOSTED } = require('../constants');
const { funcApi, logDeep } = require('../utils');
const {
  asanaPuppeteerLocalOnly,
  asanaPuppeteerOpen,
} = require('../asana/asana.puppeteer.utils');

const ASANA_FILTER_DIALOG_SELECTOR = '.MultiSortFilterDialog';

const isValidFilters = filters => (
  Boolean(filters?.customFieldName)
  && Boolean(filters?.customFieldValue)
);

const asanaViewFilterTrainButtonClick = async page => {
  await page.waitForFunction(
    () => [...document.querySelectorAll('.FilterTrain-textButton')].some(filterButton => {
      const text = filterButton.textContent.trim();

      return text === 'Filter' || text.startsWith('Filters:');
    }),
    { timeout: 30000 },
  );

  await page.evaluate(() => {
    const filterButton = [...document.querySelectorAll('.FilterTrain-textButton')].find(el => {
      const text = el.textContent.trim();

      return text === 'Filter' || text.startsWith('Filters:');
    });

    filterButton?.click();
  });
};

const asanaViewFilterAddFilterButtonClick = async page => {
  await page.waitForFunction(
    () => [...document.querySelectorAll('.AddItemButton-button')].some(addFilterButton => (
      addFilterButton.textContent.trim() === 'Add filter'
    )),
    { timeout: 10000 },
  );

  await page.evaluate(() => {
    const addFilterButton = [...document.querySelectorAll('.AddItemButton-button')].find(el => (
      el.textContent.trim() === 'Add filter'
    ));

    addFilterButton?.click();
  });
};

const asanaViewFilterCustomFieldRowExists = async (page, customFieldName) => (
  page.evaluate(fieldName => (
    [...document.querySelectorAll('.MultiFilterMenuContents--innerRow')].some(row => (
      row.textContent.trim().startsWith(fieldName)
    ))
  ), customFieldName)
);

const asanaViewFilterCustomFieldMenuItemClick = async (page, customFieldName) => {
  await page.waitForFunction(
    () => [...document.querySelectorAll('[role="menuitem"]')].some(menuItem => (
      menuItem.querySelector('.AddFilterMenuItem-labelContainer')
    )),
    { timeout: 10000 },
  );

  await page.waitForFunction(
    fieldName => [...document.querySelectorAll('[role="menuitem"]')].some(menuItem => (
      menuItem.querySelector('.AddFilterMenuItem-labelContainer')?.textContent?.trim() === fieldName
      || menuItem.textContent?.trim() === fieldName
    )),
    { timeout: 10000 },
    customFieldName,
  );

  const menuItemClicked = await page.evaluate(fieldName => {
    const menuItem = [...document.querySelectorAll('[role="menuitem"]')].find(el => (
      el.querySelector('.AddFilterMenuItem-labelContainer')?.textContent?.trim() === fieldName
      || el.textContent?.trim() === fieldName
    ));

    if (!menuItem) {
      return false;
    }

    menuItem.scrollIntoView({ block: 'nearest' });
    menuItem.click();
    return true;
  }, customFieldName);

  if (!menuItemClicked) {
    return {
      success: false,
      error: [`Custom field filter menu item not found: ${ customFieldName }`],
    };
  }

  await page.waitForFunction(
    () => Boolean(document.querySelector('.MultiFilterMenuContents--innerRow')),
    { timeout: 10000 },
  );

  return { success: true };
};

const asanaViewFilterCustomFieldValuePickerClick = async (page, customFieldName) => {
  await page.waitForFunction(
    fieldName => {
      const dialog = document.querySelector('.MultiSortFilterDialog');

      return Boolean(
        dialog?.querySelector('#CustomPropertyEnumOptionsMultiPickerInput')
        || dialog?.querySelector(`[role="button"][aria-label^="${ fieldName }"]`)
        || dialog?.querySelector('.MultiPickerInput-option--empty'),
      );
    },
    { timeout: 10000 },
    customFieldName,
  );

  const pickerSelectors = [
    `${ ASANA_FILTER_DIALOG_SELECTOR } #CustomPropertyEnumOptionsMultiPickerInput`,
    `${ ASANA_FILTER_DIALOG_SELECTOR } [role="button"][aria-label^="${ customFieldName }"]`,
    `${ ASANA_FILTER_DIALOG_SELECTOR } .MultiPickerInput-option--empty`,
  ];

  for (const pickerSelector of pickerSelectors) {
    const picker = await page.$(pickerSelector);

    if (picker) {
      await picker.click();
      return;
    }
  }

  throw new Error(`Custom field value picker not found for ${ customFieldName }`);
};

const asanaViewFilterCustomFieldValueOptionClick = async (page, customFieldValue) => {
  await page.waitForFunction(
    value => [...document.querySelectorAll('[role="option"]')].some(option => (
      option.textContent.trim() === value
      && getComputedStyle(option).visibility !== 'hidden'
    )),
    { timeout: 10000 },
    customFieldValue,
  );

  const optionClicked = await page.evaluate(value => {
    const option = [...document.querySelectorAll('[role="option"]')].find(el => (
      el.textContent.trim() === value
      && getComputedStyle(el).visibility !== 'hidden'
    ));

    if (!option) {
      return false;
    }

    option.click();
    return true;
  }, customFieldValue);

  if (!optionClicked) {
    return {
      success: false,
      error: [`Custom field value option not found: ${ customFieldValue }`],
    };
  }

  return { success: true };
};

const asanaViewFilterMenusDismiss = async page => {
  await page.evaluate(() => {
    document.querySelector('.MultiFilterMenuContents')?.click();
  });

  await page.waitForFunction(
    () => ![...document.querySelectorAll('[role="option"]')].some(option => (
      getComputedStyle(option).visibility !== 'hidden'
    )),
    { timeout: 5000 },
  ).catch(() => {});

  await page.evaluate(() => {
    document.querySelector('.BoardBody-columnHeaders')?.click();
  });

  await page.waitForFunction(
    () => !document.querySelector('.MultiSortFilterDialog'),
    { timeout: 5000 },
  ).catch(() => {});
};

const asanaViewFilterSaveViewClick = async page => {
  await page.waitForFunction(
    () => [...document.querySelectorAll('[role="button"]')].some(saveViewButton => (
      saveViewButton.textContent.trim() === 'Save view'
    )),
    { timeout: 10000 },
  );

  const saveViewClicked = await page.evaluate(() => {
    const saveViewButton = [...document.querySelectorAll('[role="button"]')].find(el => (
      el.textContent.trim() === 'Save view'
    ));

    if (!saveViewButton) {
      return false;
    }

    saveViewButton.click();
    return true;
  });

  if (!saveViewClicked) {
    return {
      success: false,
      error: ['Save view button not found'],
    };
  }

  await page.waitForFunction(
    () => ![...document.querySelectorAll('[role="button"]')].some(saveViewButton => (
      saveViewButton.textContent.trim() === 'Save view'
    )),
    { timeout: 10000 },
  );

  return { success: true };
};

const asanaViewFilterApply = async (
  viewUrl,
  filters,
  {
    headless = false,
    userDataDir,
    saveView = true,
    onPage = false,
    page,
  } = {},
) => {

  const localOnlyResponse = asanaPuppeteerLocalOnly();
  if (localOnlyResponse) {
    return localOnlyResponse;
  }

  if (!isValidFilters(filters)) {
    return {
      success: false,
      error: ['filters must include customFieldName and customFieldValue'],
    };
  }

  const { customFieldName, customFieldValue } = filters;

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
    !HOSTED && logDeep('asanaViewFilterApply viewUrl', viewUrl);
    !HOSTED && logDeep('asanaViewFilterApply filters', filters);

    await activePage.waitForFunction(
      () => Boolean(document.querySelector('.ProjectBoardPageToolbar')),
      { timeout: 30000 },
    );

    await asanaViewFilterTrainButtonClick(activePage);

    const customFieldRowExists = await asanaViewFilterCustomFieldRowExists(
      activePage,
      customFieldName,
    );

    if (!customFieldRowExists) {
      await asanaViewFilterAddFilterButtonClick(activePage);

      const customFieldMenuItemResponse = await asanaViewFilterCustomFieldMenuItemClick(
        activePage,
        customFieldName,
      );

      if (!customFieldMenuItemResponse.success) {
        return customFieldMenuItemResponse;
      }
    } else {
      await activePage.waitForFunction(
        () => Boolean(document.querySelector('.MultiFilterMenuContents--innerRow')),
        { timeout: 10000 },
      );
    }

    await asanaViewFilterCustomFieldValuePickerClick(activePage, customFieldName);

    const customFieldValueOptionResponse = await asanaViewFilterCustomFieldValueOptionClick(
      activePage,
      customFieldValue,
    );

    if (!customFieldValueOptionResponse.success) {
      return customFieldValueOptionResponse;
    }

    await asanaViewFilterMenusDismiss(activePage);

    if (saveView) {
      const saveViewResponse = await asanaViewFilterSaveViewClick(activePage);

      if (!saveViewResponse.success) {
        return saveViewResponse;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    const viewUrlAfterFilter = activePage.url();

    !HOSTED && logDeep('asanaViewFilterApply viewUrlAfterFilter', viewUrlAfterFilter);

    return {
      success: true,
      result: {
        step: 'view_filter_applied',
        viewUrl: viewUrlAfterFilter,
        filters,
        saveView,
      },
    };
  } finally {
    if (browser) {
      await browser.close();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const asanaViewFilterApplyApi = funcApi(asanaViewFilterApply, {
  argNames: ['viewUrl', 'filters', 'options'],
  validatorsByArg: {
    viewUrl: Boolean,
    filters: isValidFilters,
  },
});

module.exports = {
  asanaViewFilterApply,
  asanaViewFilterApplyApi,
};

// curl localhost:8000/asanaViewFilterApply -H "Content-Type: application/json" -d '{ "viewUrl": "https://app.asana.com/1/764221262452024/project/1208942389126559/board/1215269378657314", "filters": { "customFieldName": "Epic", "customFieldValue": "Foxlore" } }'
