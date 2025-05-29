import { connectToDatabase } from "./utils.js";

export default async function getEnergy(event) {
  const queryParams = event.queryStringParameters || {};
  const { start, end } = queryParams;

  if (!start || !end) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing 'start' or 'end' query parameters" }),
    };
  }

  try {
    const client = await connectToDatabase();
    const collection = client.db("power_meter").collection("readings");

    const result = await collection.aggregate([
      {
        $match: {
          Time: {
            $gte: new Date(start),
            $lte: new Date(end)
          }
        }
      },
      {
        $setWindowFields: {
          sortBy: { Time: 1 },
          output: {
            prevTime: {
              $shift: {
                output: "$Time",
                by: -1
              }
            }
          }
        }
      },
      {
        $addFields: {
          deltaT: {
            $divide: [
              { $subtract: ["$Time", "$prevTime"] },
              1000
            ]
          }
        }
      },
      {
        $addFields: {
          deltaT: {
            $cond: [
              { $gt: ["$deltaT", 300] },
              0,
              "$deltaT"
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          energy_kWh_phase1: {
            $multiply: [230, "$IRMS1", 0.9, { $divide: ["$deltaT", 3600 * 1000] }]
          },
          energy_kWh_phase2: {
            $multiply: [230, "$IRMS2", 0.9, { $divide: ["$deltaT", 3600 * 1000] }]
          },
          energy_kWh_phase3: {
            $multiply: [230, "$IRMS3", 0.9, { $divide: ["$deltaT", 3600 * 1000] }]
          }
        }
      },
      {
        $group: {
          _id: null,
          energy_kWh_phase1: { $sum: "$energy_kWh_phase1" },
          energy_kWh_phase2: { $sum: "$energy_kWh_phase2" },
          energy_kWh_phase3: { $sum: "$energy_kWh_phase3" }
        }
      },
      {
        $addFields: {
          total_energy_kWh: {
            $add: [
              "$energy_kWh_phase1",
              "$energy_kWh_phase2",
              "$energy_kWh_phase3"
            ]
          }
        }
      }
    ]).toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(result[0] || {
        energy_kWh_phase1: 0,
        energy_kWh_phase2: 0,
        energy_kWh_phase3: 0,
        total_energy_kWh: 0
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Database error" }),
    };
  }
}
