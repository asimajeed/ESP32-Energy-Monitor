import { connectToDatabase } from './nodejs/utils.js';

async function setupTimeSeriesCollection() {
  const client = await connectToDatabase();
  const db = client.db("power_meter");
  const collectionName = "readings";

  const collections = await db.listCollections({ name: collectionName }).toArray();

  if (collections.length === 0) {
    await db.createCollection(collectionName, {
      timeseries: {
        timeField: "Time",
        granularity: "minutes"
      }
    });
    await db.collection(collectionName).createIndex({ Time: 1 });

    console.log(`Created time series collection '${collectionName}' with index on Time.`);
  } else {
    console.log(`Collection '${collectionName}' already exists. Skipping creation.`);
  }

  client.close();
}

setupTimeSeriesCollection().catch(console.error);
