import { configDotenv } from "dotenv";
configDotenv()

export const handler = async (event) => {
  let response = {
      "isAuthorized": false,
      "context": {
          "stringKey": "value",
          "numberKey": 1,
          "booleanKey": true,
          "arrayKey": ["value1", "value2"],
          "mapKey": {"value1": "value2"}
      }
  };
  
  if (event.headers.authorization === process.env.SECRET_TOKEN) {
      console.log("allowed");
      response = {
          "isAuthorized": true,
          "context": {
              "stringKey": "value",
              "numberKey": 1,
              "booleanKey": true,
              "arrayKey": ["value1", "value2"],
              "mapKey": {"value1": "value2"}
          }
      };
  }

  return response;

};
