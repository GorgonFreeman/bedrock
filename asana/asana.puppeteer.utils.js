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
  asanaPuppeteerLocalOnly,
  asanaProjectUrl,
  asanaPuppeteerLaunch,
  asanaPuppeteerOpen,
};
