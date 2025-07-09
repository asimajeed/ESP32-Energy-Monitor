import { MongoClient } from "mongodb";
import { configDotenv } from "dotenv";
configDotenv()

const uri = process.env.MONGO_URI;
let cachedClient = null;
!uri && console.log("MongoDB URI is ", uri);
export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client =  new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  console.log("returning");
  return client;
}
