const { credsByPath, CustomAxiosClient, Getter, getterAsGetFunction, logDeep, askQuestion } = require('../utils');

const stylearcadeRequestSetup = ({ credsPath } = {}) => {
  const creds = credsByPath(['stylearcade', credsPath]);
  const { 
    BASE_URL, 
    API_KEY, 
  } = creds;

  return {
    baseUrl: BASE_URL,
    headers: {
      'Api-Key': API_KEY,
    },
  };
};

const stylearcadeClient = new CustomAxiosClient({
  preparer: stylearcadeRequestSetup,
  baseHeaders: {
    'Content-Type': 'application/json',
  },
  baseInterpreter: (response, context) => {
    const { resultsNode } = context;

    if (!resultsNode) {
      return response;
    }

    return {
      ...response,
      ...response?.result && { result: response.result?.[resultsNode] },
    };
  },
});

const stylearcadeGetterPaginator = async (customAxiosPayload, response, additionalPaginationData) => {
  // console.log('stylearcadeGetterPaginator', customAxiosPayload, response, additionalPaginationData);
  // await askQuestion('Continue?');

  const { success, result } = response;
  if (!success || !result) { // Return if failed
    return [true, null];
  }

  const { nextCursor } = result;

  // Supplement payload with next pagination info
  const paginatedPayload = {
    ...customAxiosPayload,
    params: {
      ...customAxiosPayload.params,
      ...(nextCursor && { cursor: nextCursor }),
    },
  };
  
  // Logic to determine done
  const done = !nextCursor;
  
  return [done, paginatedPayload];
};

const stylearcadeGetterDigester = async (response, resultsNode) => {
  // logDeep('digester: get items from response', response, resultsNode);
  // await askQuestion('?');

  const { success, result } = response;
  if (!success || !result) { // Return if failed
    return null;
  }

  const items = result?.[resultsNode];
  // console.log('items', items?.length);

  return items;
};

const stylearcadeGetter = async (
  {
    url,
    params,
    perPage = 100,
    context,
    resultsNode,
    ...getterOptions
  } = {},
) => {
  return new Getter(
    {
      url,
      payload: {
        params: {
          ...params,
          limit: perPage,
        },
      },
      paginator: stylearcadeGetterPaginator,
      digester: (response) => stylearcadeGetterDigester(response, resultsNode),
      client: stylearcadeClient,
      clientArgs: {
        context,
      },
      ...getterOptions,
    },
  );
};

const stylearcadeGet = getterAsGetFunction(stylearcadeGetter);

// Helper function to parse dimensions from Style Arcade af60note field
const parseDimensions = (dimsNote) => {
  if (!dimsNote || dimsNote.trim() === '') return null;
  
  try {
    // Remove newlines and \n characters, then replace non-numeric characters with 'x'
    const cleanedDims = dimsNote.replace(/\n/g, '').replace(/\r/g, '').replace(/[^0-9\.]+/g, 'x');
    const dimensions = cleanedDims.split('x').filter(d => d.trim() !== '').map(d => parseFloat(d.trim()));
    
    if (dimensions.length < 3 || dimensions.some(isNaN)) return null;
    
    // Take first 3 dimensions and format
    const [w, l, d] = dimensions.slice(0, 3);
    const cmString = `${w} x ${l} x ${d}`;
    
    // Convert to inches (multiply by 0.393 and round to 1 decimal)
    const inchDimensions = dimensions.slice(0, 3).map(dim => Math.round(dim * 0.393 * 10) / 10);
    const inchString = `${inchDimensions[0]} x ${inchDimensions[1]} x ${inchDimensions[2]}`;
    
    return { cm: cmString, inches: inchString };
  } catch (error) {
    return null;
  }
};

module.exports = {
  stylearcadeClient,
  stylearcadeGetter,
  stylearcadeGet,
  parseDimensions,
};
