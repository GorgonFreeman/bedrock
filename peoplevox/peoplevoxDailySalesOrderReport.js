const {
  funcApi,
  logDeep,
  askQuestion,
} = require("../utils");
const { peoplevoxDateFormatter } = require("./peoplevox.utils");
const { peoplevoxReportGet } = require("./peoplevoxReportGet");
const { slackMessagePost } = require("../slack/slackMessagePost");

const peoplevoxDailySalesOrderReport = async ({
  dateFilter,
  userId = "C0A07UT729F", // U042STM5B3R Arther - U0723SZKSQ0 Benny
  credsPath,
} = {}) => {
  try {
    const todaysDate = new Date()
      .toISOString()
      .split("T")[0];
    const filterDate = dateFilter || todaysDate;

    //logDeep(peoplevoxDateFormatter(filterDate));
    //await askQuestion("?");

    const openItemsReportResponse = await peoplevoxReportGet("Open items + orders", {
      credsPath,
    });

    const yesterdaysOrderItemsReport = await peoplevoxReportGet("yesterday order items despatched", {
      credsPath,
    });

    //logDeep(openItemsReportResponse);
    //await askQuestion("?");

    if (!openItemsReportResponse.success) {
      return openItemsReportResponse;
    }

    if (!yesterdaysOrderItemsReport.success) {
      return yesterdaysOrderItemsReport;
    }

    const reportData = openItemsReportResponse.result || [];
    const yesterdayOrderItemsReportData = yesterdaysOrderItemsReport.result || [];

    //logDeep("Report data:", reportData);
    //await askQuestion("?");

    const firstResult = reportData[0] || {};
    const firstYesterdaysOrderItemsReportResult = yesterdayOrderItemsReportData[0] || {};

    const openOrdersCount = parseInt(firstResult["Sales order no."] || "0", 10);
    const totalOpenItems = parseInt(firstResult["Number of items"] || "0", 10);

    const yesterdayOrdersCount = parseInt(firstYesterdaysOrderItemsReportResult["Salesorder number"] || "0", 10);
    const yesterdayItemsCount = parseInt(firstYesterdaysOrderItemsReportResult["No of items"] || "0", 10);

    const totalRowsProcessed = reportData.length;
    const timestamp = new Date().toISOString();

    const slackMessage = `:bar_chart: Peoplevox WMS Open Items Report
Open Orders (count): ${openOrdersCount}
Open Items (sum): ${totalOpenItems}
Rows processed: ${totalRowsProcessed}


:package: Yesterday's Order Items Despatched
Orders Despatched: ${yesterdayOrdersCount}
Items Despatched: ${yesterdayItemsCount}
:clock3: Generated: ${timestamp}`;

    const slackResponse = await slackMessagePost({ channelId: userId }, { text: slackMessage }, { credsPath });

    logDeep("Slack response:", slackResponse);

    return {
      success: true,
      result: {
        openOrdersCount,
        totalOpenItems,
        totalRowsProcessed,
        yesterdayOrdersCount,
        yesterdayItemsCount,
        timestamp,
        slackMessageSent: slackResponse.success,
        dateFilter: filterDate,
      },
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};

const peoplevoxDailySalesOrderReportApi = funcApi(peoplevoxDailySalesOrderReport, {
  argNames: ["options"],
});

module.exports = {
  peoplevoxDailySalesOrderReport,
  peoplevoxDailySalesOrderReportApi,
};

// curl localhost:8000/peoplevoxDailySalesOrderReport
// curl localhost:8000/peoplevoxDailySalesOrderReport -H "Content-Type: application/json" -d '{ "options": { "dateFilter": "2024-01-15" } }'
