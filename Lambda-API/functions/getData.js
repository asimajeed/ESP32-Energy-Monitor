import { connectToDatabase } from "./utils.js";

const parseISODate = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

const buildAggregationPipeline = (startDate, endDate) => [
  { $match: { Time: { $gte: startDate, $lte: endDate } } },
  {
    $project: {
      formatted: {
        $concat: [
          { $toString: "$Time" },
          ", ",
          { $toString: "$IRMS1" },
          ", ",
          { $toString: "$IRMS2" },
          ", ",
          { $toString: "$IRMS3" },
        ],
      },
    },
  },
];

export const handler = async (event) => {
  const queryParams = event.queryStringParameters || {};
  const { start_date, end_date } = queryParams;

  if (!start_date || !end_date) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `Missing required parameters: start_date and end_date ${JSON.stringify(event.queryStringParameters)}` }),
    };
  }

  const startDate = parseISODate(start_date);
  const endDate = parseISODate(end_date);
  if (!startDate || !endDate) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid ISO date format" }),
    };
  }

  let client;
  try {
    client = await connectToDatabase();
    const db = client.db("power_meter");
    const collection = db.collection("readings");

    const pipeline = buildAggregationPipeline(startDate, endDate);
    const cursor = collection.aggregate(pipeline);

    const results = [];
    for await (const doc of cursor) {
      results.push(doc.formatted);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/plain" },
      body: results.join("\n"),
    };
  } catch (err) {
    console.error("Error querying MongoDB:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
