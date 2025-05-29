import postReadings from "./postReadings.js"

postReadings(
  JSON.parse(`{ 
  "body": {
    "Time": ["2024-10-11T00:00:00Z", "2024-10-11T00:01:00Z"],
    "IRMS1": [2.07, 1.22],
    "IRMS2": [9.92, 9.66],
    "IRMS3": [10.73, 10.78]
  }
}`)
)
  .then((res) => {
    console.log("Handler Response:", res);
    process.exit();
  })
  .catch((err) => {
    console.error("Handler Error:", err);
    process.exit(1);
  });
