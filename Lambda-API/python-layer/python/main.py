import json
from datetime import datetime
from utils import get_mongo_client
import time

DB_NAME = "power_meter"
DATA_COLLECTION = "readings"


def lambda_handler(event, context):
    global start
    global end
    queryParams = event.get("queryStringParameters") or {}
    required_params = ["start_date", "end_date"]
    if not all(param in queryParams for param in required_params):
        return {"statusCode": 400, "body": "Missing required parameters"}

    start = queryParams["start_date"]
    end = queryParams["end_date"]

    client = get_mongo_client()
    db = client[DB_NAME]
    collection = db[DATA_COLLECTION]

    try:
        start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
    except ValueError:
        return {"statusCode": 400, "body": "Invalid date format"}
    start = time.time()

    try:
        cursor = collection.aggregate(
            [
                {"$match": {"Time": {"$gte": start_dt, "$lte": end_dt}}},
                {
                    "$project": {
                        "formatted": {
                            "$concat": [
                                {"$toString": "$Time"},
                                ", ",
                                {"$toString": "$IRMS1"},
                                ", ",
                                {"$toString": "$IRMS2"},
                                ", ",
                                {"$toString": "$IRMS3"},
                            ]
                        }
                    }
                },
            ]
        )

        result = "\n".join(doc["formatted"] for doc in cursor)
        return {"statusCode": 200, "body": result}

    finally:
        client.close()



print(lambda_handler({"queryStringParameters": {"start_date": "2025-04-04T00:00:00Z", "end_date": "2025-04-05T00:00:00Z"}}, ""))
end = time.time()

print("The time of execution of above program is :", (end - start) * 10**3, "ms")

# record end time

# print the difference between start
# and end time in milli. secs