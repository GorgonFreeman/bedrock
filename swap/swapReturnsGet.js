const {
  funcApi,
  logDeep,
  dateFromNowCalendar,
} = require("../utils");
const { swapClient } = require("../swap/swap.utils");

const swapReturnsGet = async (
  credsPath,
  fromDatePayload,
  {
    toDatePayload,
    limit = 50,
    version = 1,
  } = {},
) => {
  let { fromDate, fromDateAdjuster } = fromDatePayload || {};

  if (!fromDate && fromDateAdjuster) {
    fromDate = dateFromNowCalendar({ ...fromDateAdjuster, dateOnly: true });
  }

  let { toDate, toDateAdjuster } = toDatePayload || {};

  if (!toDate && toDateAdjuster) {
    toDate = dateFromNowCalendar({ ...toDateAdjuster, dateOnly: true });
  }

  const response = await swapClient.fetch({
    url: `/returns`,
    params: {
      limit,
      version,
      from_date: fromDate,
      ...(toDate && { to_date: toDate }),
    },
    context: {
      credsPath,
    },
  });

  logDeep(response);
  return response;
};

const swapReturnsGetApi = funcApi(swapReturnsGet, {
  argNames: [
    "credsPath",
    "fromDatePayload",
    "options",
  ],
});

module.exports = {
  swapReturnsGet,
  swapReturnsGetApi,
};

// curl localhost:8000/swapReturnsGet -H "Content-Type: application/json" -d '{ "credsPath": "uk", "fromDatePayload": { "fromDateAdjuster": { "days": -10 } } }'
