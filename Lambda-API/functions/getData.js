import { connectToDatabase } from "./utils.js";

const parseISODate = (dateStr) => {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

export const handler = async (event) => {
  const queryParams = event.queryStringParameters || {};
  const { start_date, end_date } = queryParams;

  if (!start_date || !end_date) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Missing required parameters: start_date and end_date`,
        received: event.queryStringParameters,
      }),
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

    const results = await collection.find({
      Time: { $gte: startDate, $lte: endDate }
    });
    //   ,
    // }).project({
    //   Time: 1,
    //   IRMS1: 1,
    //   IRMS2: 1,
    //   IRMS3: 1,
    //   _id: 0
    // }).toArray();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(results),
    };
  } catch (err) {
    console.error("Error querying MongoDB:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};
