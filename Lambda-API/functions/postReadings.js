import { connectToDatabase } from "../node-layer/nodejs/utils.js";

export default async function handler(event) {
  const parsedBody = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
  const { Time, IRMS1, IRMS2, IRMS3 } = parsedBody;

  if (!Time || !IRMS1 || !IRMS2 || !IRMS3) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing data fields" }),
    };
  }

  const docs = Time.map((time, i) => ({
    Time: new Date(time),
    IRMS1: IRMS1[i],
    IRMS2: IRMS2[i],
    IRMS3: IRMS3[i],
  }));

  try {
    const client = await connectToDatabase();
    const collection = client.db("power_meter").collection("readings");
    await collection.insertMany(docs);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Data inserted successfully" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Database error" }),
    };
  }
}