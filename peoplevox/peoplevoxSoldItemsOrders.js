const {
  funcApi,
  logDeep,
  askQuestion,
} = require("../utils");
const { peoplevoxDateFormatter } = require("./peoplevox.utils");
const { peoplevoxReportGet } = require("./peoplevoxReportGet");
const { slackMessagePost } = require("../slack/slackMessagePost");

const peoplevoxSoldItemsOrders = async ({
  dateFilter,
  userId = "U0723SZKSQ0", // U042STM5B3R Arther - U0723SZKSQ0 Benny
  credsPath,
} = {}) => {
  try {
    const todaysDate = new Date()
      .toISOString()
      .split("T")[0];
    const filterDate = dateFilter || todaysDate;

    const soldItemsOrdersReportResponse = await peoplevoxReportGet("ACTUAL SOLD ITEMS + ORDERS", {
      credsPath,
    });

    if (!soldItemsOrdersReportResponse.success) {
      return soldItemsOrdersReportResponse;
    }

    const reportData = soldItemsOrdersReportResponse.result || [];

    // Process the report data to extract metrics
    const totalItems = reportData.reduce((sum, row) => {
      // Handle nested structure: No[' of items']
      const itemCount = row.No?.[' of items'] || row["No. of items"] || "0";
      return sum + parseInt(itemCount, 10);
    }, 0);

    const totalOrders = reportData.length;
    const timestamp = new Date().toISOString();

    let reportDetails = "";
    if (reportData.length > 0) {
      reportDetails = reportData.map(row => {
        const salesOrderNo = row["Sales order no."] || "N/A";
        // Handle nested structure: No[' of items']
        const noOfItems = row.No?.[' of items'] || row["No. of items"] || "0";
        const requestedDeliveryDate = row["Requested delivery date"] || "N/A";
        return `${salesOrderNo} | ${noOfItems} items | ${requestedDeliveryDate}`;
      }).join("\n");
    }

    const slackMessage = `:package: Peoplevox WMS ACTUAL SOLD ITEMS + ORDERS
${reportDetails || "No data available"}

Total Orders: ${totalOrders}
Total Items: ${totalItems}
:clock3: Generated: ${timestamp}`;

    const slackResponse = await slackMessagePost({ channelId: userId }, { text: slackMessage }, { credsPath });

    logDeep("Slack response:", slackResponse);

    return {
      success: true,
      result: {
        totalOrders,
        totalItems,
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

const peoplevoxSoldItemsOrdersApi = funcApi(peoplevoxSoldItemsOrders, {
  argNames: ["options"],
});

module.exports = {
  peoplevoxSoldItemsOrders,
  peoplevoxSoldItemsOrdersApi,
};

// curl localhost:8000/peoplevoxSoldItemsOrders
// curl localhost:8000/peoplevoxSoldItemsOrders -H "Content-Type: application/json" -d '{ "options": { "dateFilter": "2024-01-15" } }'
