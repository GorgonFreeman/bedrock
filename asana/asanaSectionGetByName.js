const { funcApi } = require('../utils');
const { asanaSectionsGet } = require('../asana/asanaSectionsGet');

const asanaSectionGetByName = async (
  sectionName,
  projectIdentifier,
  {
    credsPath,
  } = {},
) => {

  const sectionsResponse = await asanaSectionsGet(
    projectIdentifier, 
    { 
      credsPath,
    },
  );

  const {
    success: sectionsSuccess,
    result: sections,
  } = sectionsResponse;

  if (!sectionsSuccess) {
    return sectionsResponse;
  }

  const section = sections.find(section => section.name === sectionName);

  if (!section) {
    return {
      success: false,
      error: [`Section "${ sectionName }" not found in project`],
    };
  }

  return {
    success: true,
    result: section,
  };
};

const asanaSectionGetByNameApi = funcApi(asanaSectionGetByName, {
  argNames: ['sectionName', 'projectIdentifier', 'options'],
  validatorsByArg: {
    sectionName: Boolean,
    projectIdentifier: Boolean,
  },
});

module.exports = {
  asanaSectionGetByName,
  asanaSectionGetByNameApi,
};

// curl localhost:8000/asanaSectionGetByName -X POST -H "Content-Type: application/json" -d '{"sectionName": "UAT", "projectIdentifier": { "projectHandle": "dev" } }'