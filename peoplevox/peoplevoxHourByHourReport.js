const {
  funcApi,
  logDeep,
  askQuestion,
} = require("../utils");
const { peoplevoxDateFormatter } = require("./peoplevox.utils");
const { peoplevoxReportGet } = require("./peoplevoxReportGet");
const { slackMessagePost } = require("../slack/slackMessagePost");

const peoplevoxHourByHourReport = async ({
  dateFilter,
  userId = "U042STM5B3R", // U042STM5B3R Arther - U0723SZKSQ0 Benny
  credsPath,
} = {}) => {
  try {
    const todaysDate = new Date()
      .toISOString()
      .split("T")[0];
    const filterDate = dateFilter || todaysDate;

    const hourByHourReportResponse = await peoplevoxReportGet("Hour by Hour", {
      credsPath,
    });

    if (!hourByHourReportResponse.success) {
      return hourByHourReportResponse;
    }

    const reportData = hourByHourReportResponse.result || [];

    // Process the report data to extract metrics
    const totalItems = reportData.reduce((sum, row) => {
      return sum + parseInt(row["No of items"] || "0", 10);
    }, 0);

    const totalRowsProcessed = reportData.length;
    const timestamp = new Date().toISOString();

    // Format the report data for the Slack message
    let reportDetails = "";
    if (reportData.length > 0) {
      reportDetails = reportData.map(row => {
        const despatchDate = row["Despatch date"] || "N/A";
        const noOfItems = row["No of items"] || "0";
        const username = row["Username"] || "N/A";
        return `${despatchDate} | ${noOfItems} items | ${username}`;
      }).join("\n");
    }

    const slackMessage = `:clock3: Peoplevox WMS Hour by Hour Report
${reportDetails || "No data available"}

Total Items: ${totalItems}
Rows processed: ${totalRowsProcessed}
:clock3: Generated: ${timestamp}`;

    const slackResponse = await slackMessagePost({ channelId: userId }, { text: slackMessage }, { credsPath });

    logDeep("Slack response:", slackResponse);

    return {
      success: true,
      result: {
        totalItems,
        totalRowsProcessed,
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

const peoplevoxHourByHourReportApi = funcApi(peoplevoxHourByHourReport, {
  argNames: ["options"],
});

module.exports = {
  peoplevoxHourByHourReport,
  peoplevoxHourByHourReportApi,
};

// curl localhost:8000/peoplevoxHourByHourReport
// curl localhost:8000/peoplevoxHourByHourReport -H "Content-Type: application/json" -d '{ "options": { "dateFilter": "2024-01-15" } }'
