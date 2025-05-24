#include <Arduino.h>
#include <driver/adc.h>
#include <WiFiManager.h> 
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoOTA.h>
#include <LittleFS.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <esp_task_wdt.h>
#include <ArduinoJson.h>
#include <ctime>
#include "config.h"
#define DEBUG_MODE  // uncomment to run debug

#ifndef DEBUG_MODE
  #define DEBUG_BEGIN(x)
  #define DEBUG_PRINT(x)
  #define DEBUG_PRINTLN(x)
#else
  #define DEBUG_BEGIN(x) Serial.begin(x)
  #define DEBUG_PRINT(x) Serial.print(x)
  #define DEBUG_PRINTLN(x) Serial.println(x)
#endif

#define ADC_INPUT_1 34
#define ADC_INPUT_2 36
#define ADC_INPUT_3 39
#define emonTxV3 1
#include <EmonLib.h>

// functions
void updateCurrent(void *);
void loadPreferences();
void connectToWifi(void *);
unsigned long roundToNearestMultiple(unsigned long num, int multiple);
std::string EPOCHtoString(unsigned long);
void logToGoogleSheets(void *);
void settingsServer();
void handleOTAUpdates(void *);

AsyncWebServer server(80);
Preferences preferences;

double currentPower = 0;
double currentIrms_1 = 0;
double currentIrms_2 = 0;
double currentIrms_3 = 0;
double houseVoltage = 0;
double calibrationVal1 = 0;
double calibrationVal2 = 0;
double calibrationVal3 = 0;
bool initialized = false;
int numMeasurements;
int interval;
EnergyMonitor emon1;
EnergyMonitor emon2;
EnergyMonitor emon3;

void setup() {
  DEBUG_BEGIN(115200);

  // Initialize SPIFFS
  if (!LittleFS.begin(true)) {
    DEBUG_PRINTLN(String("An Error has occurred while mounting SPIFFS"));
    return;
  }
  loadPreferences();

  // setup the ADC and current sensor
  adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_12);
  adc1_config_channel_atten(ADC1_CHANNEL_3, ADC_ATTEN_DB_12);
  adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_12);
  analogReadResolution(ADC_BITS);
  pinMode(ADC_INPUT_1, INPUT);
  emon1.current(ADC_INPUT_1, calibrationVal1);
  pinMode(ADC_INPUT_2, INPUT);
  emon2.current(ADC_INPUT_2, calibrationVal2);
  pinMode(ADC_INPUT_3, INPUT);
  emon3.current(ADC_INPUT_3, calibrationVal3);

  // Connect to WiFi
  connectToWifi(NULL);

  xTaskCreatePinnedToCore(
    updateCurrent,
    "Update Current Task",
    2048,
    NULL,
    2,
    NULL,
    1
  );

  xTaskCreatePinnedToCore(
    logToGoogleSheets,
    "Log to Google Task",
    12000,
    NULL,
    1,
    NULL,
    0
  );

  xTaskCreatePinnedToCore(
    handleOTAUpdates,
    "OTA Task",
    10000,
    NULL,
    1,
    NULL,
    0 // Pin to core 1
  );

  settingsServer();
}

void loop() {
  // Fix: Don't delete the main task, just delay
  delay(1000);
}

void updateCurrent(void *parameters)
{
  int count = 0;
  while (true) {
    if (!initialized) {
      count++;
      if (count >= 5) {
        initialized = true;
        count = 0;
      }
    }
    unsigned long start = millis();

    currentIrms_1 = emon1.calcIrms(1480);
    currentIrms_2 = emon2.calcIrms(1480);
    currentIrms_3 = emon3.calcIrms(1480);
    currentPower = currentIrms_1 * houseVoltage;

    unsigned long end = millis();
    unsigned long elapsed = end - start;
    if (elapsed < 1000) {
      vTaskDelay((1000 - elapsed) / portTICK_PERIOD_MS);
    }
    // else {
      // vTaskDelay(10 / portTICK_PERIOD_MS); // Minimum delay
    // }
  }
}

void loadPreferences()
{
  preferences.begin("settings", false);
  houseVoltage = preferences.getDouble("houseVoltage", 230.0);
  calibrationVal1 = preferences.getDouble("calibrationVal1", 100.0 / 0.046288 / 27.0);
  calibrationVal2 = preferences.getDouble("calibrationVal2", 100.0 / 0.050 / 27.0);
  calibrationVal3 = preferences.getDouble("calibrationVal3", 100.0 / 0.050 / 27.0);
  numMeasurements = preferences.getInt("numMeasurements", 5);
  interval = preferences.getInt("interval", 60);
  preferences.putDouble("houseVoltage", houseVoltage);
  preferences.putDouble("calibrationVal1", calibrationVal1);
  preferences.putDouble("calibrationVal2", calibrationVal2);
  preferences.putDouble("calibrationVal3", calibrationVal3);
  preferences.putInt("numMeasurements", numMeasurements);
  preferences.putInt("interval", interval);
  preferences.end(); // Fix: Close preferences
}

void connectToWifi(void *Param) {
  WiFi.mode(WIFI_STA);
  IPAddress staticIP(192, 168, 100, 4);
  IPAddress gateway(192, 168, 100, 1);
  IPAddress subnet(255, 255, 255, 0);
  IPAddress dns(1, 1, 1, 1);
  WiFiManager wm;

#ifndef DEBUG_MODE
  wm.setDebugOutput(false);
#endif

  wm.setSTAStaticIPConfig(staticIP, gateway, subnet, dns);
  wm.setConfigPortalTimeout(120);
  WiFi.setHostname("ESP32");
  if (!wm.autoConnect("Power Meter AP", "password")) {
    DEBUG_PRINTLN(String("Failed to connect"));
    ESP.restart();
  }
  WiFi.setAutoReconnect(true);
  DEBUG_PRINTLN(String("Connected to WiFi!"));
  DEBUG_PRINT("IP Address: ");
  DEBUG_PRINTLN(WiFi.localIP().toString());
  DEBUG_PRINT("DNS: ");
  DEBUG_PRINTLN(WiFi.dnsIP().toString());
}

unsigned long roundToNearestMultiple(unsigned long num, int multiple) {
  if (multiple == 0) {
    return num;
  }
  unsigned long remainder = num % multiple;
  if (remainder == 0) {
    return num;
  }
  unsigned long  roundedNum = num + (remainder < multiple / 2 ? -remainder : (multiple - remainder));
  return roundedNum;
}

std::string EPOCHtoString(unsigned long epoch)
{
    std::string str;
    char temp[20];
    time_t now = epoch;
    struct tm ts;
    ts = *localtime(&now);
    strftime(temp, sizeof(temp), "%d/%m/%Y %H:%M:%S", &ts);
    str.append(temp);
    return str;
}

void logToGoogleSheets(void *)
{
  int counter = 0;
  WiFiUDP ntpUDP;
  NTPClient timeClient(ntpUDP, 5 * 60 * 60);
  String googleScriptUrl = (SCRIPT_LINK);
  JsonDocument jsonData;
  timeClient.begin();
  esp_task_wdt_init(interval + 20, true);
  esp_task_wdt_add(NULL);

  while (1) {
    counter = 0;
    jsonData.clear();
    
    yield();
    
    if (interval % 5 == 0) {
      while (true) {
        timeClient.forceUpdate();
        unsigned long epochTime = timeClient.getEpochTime();
        esp_task_wdt_reset();
        if (epochTime % interval == 0 && initialized) {
          break;
        }
        yield();
      }
    }

    while (initialized) {
      unsigned long start = millis();
      if (counter < numMeasurements) {
        timeClient.update();
        jsonData["Time"].add(EPOCHtoString(roundToNearestMultiple(timeClient.getEpochTime(), interval)));
        jsonData["IRMS1"].add(int(currentIrms_1 * 100) / 100.0);
        jsonData["IRMS2"].add(int(currentIrms_2 * 100) / 100.0);
        jsonData["IRMS3"].add(int(currentIrms_3 * 100) / 100.0);
        counter++;
      }
      if (counter >= numMeasurements) {
        if (WiFi.status() != WL_CONNECTED) {
          connectToWifi(NULL);
        }
        HTTPClient http;
        String payload;
        serializeJson(jsonData, payload);
        jsonData.clear();
        DEBUG_PRINTLN(payload);
        http.begin(googleScriptUrl);
        int httpResponseCode = http.POST(payload);
        DEBUG_PRINT("HTTP Response: ");
        DEBUG_PRINTLN(httpResponseCode);
        http.end();
        counter = 0;
      }
      esp_task_wdt_reset();
      unsigned long end = millis();
      unsigned long elapsed = end - start;
      unsigned long delayTime = interval * 1000;
      if (elapsed < delayTime) {
        vTaskDelay((delayTime - elapsed) / portTICK_PERIOD_MS);
      } else {
        vTaskDelay(10 / portTICK_PERIOD_MS); // Minimum delay
      }
      yield();
    }
  }
}

void settingsServer() {
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Serving index.html");
    request->send(LittleFS, "/index.html", "text/html");
  });

  // Serve compressed styles.css
  server.on("/index.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Serving index.css");
    AsyncWebServerResponse *response = request->beginResponse(LittleFS, "/index.css.gz", "text/css");
    response->addHeader("Content-Encoding", "gzip");
    request->send(response);
  });

  // Serve compressed script.js
  server.on("/index.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Serving index.js");
    AsyncWebServerResponse *response = request->beginResponse(LittleFS, "/index.js.gz", "application/javascript");
    response->addHeader("Content-Encoding", "gzip");
    request->send(response);
  });

  server.on("/icon.png", HTTP_GET, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Serving icon.png");
    request->send(LittleFS, "/icon.png", "image/png");
  });

  server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Serving status");
    String response;
    if (!initialized) {
      response = "{\"irms1\": 0, \"irms2\": 0, \"irms3\": 0}";
    } else {
      JsonDocument data;
      data["irms1"] = int(currentIrms_1 * 100) / 100.0;
      data["irms2"] = int(currentIrms_2 * 100) / 100.0;
      data["irms3"] = int(currentIrms_3 * 100) / 100.0;
      serializeJson(data, response);
    }
    request->send(200, "application/json", response);
  });

  server.on("/settings", HTTP_GET, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Serving settings");
    String response;
    JsonDocument data;
    data["hV"] = houseVoltage;
    data["cV1"] = calibrationVal1;
    data["cV2"] = calibrationVal2;
    data["cV3"] = calibrationVal3;
    data["numms"] = numMeasurements;
    data["interval"] = interval;
    serializeJson(data, response);
    request->send(200, "application/json", response);
  });

  server.on("/reset-wifi", HTTP_POST, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Reset WiFi requested");
    String response = "WiFi settings resetting, restarting the device to reconfigure.";
    request->send(200, "text/plain", response);
    // Fix: Use task delay instead of blocking delay
    vTaskDelay(1000 / portTICK_PERIOD_MS);
    WiFiManager wm;
    wm.resetSettings();
    ESP.restart();
  });

  server.on("/restart", HTTP_POST, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Restart requested");
    String response = "Restarting...";
    request->send(200, "text/plain", response);
    // Fix: Use task delay instead of blocking delay
    vTaskDelay(1000 / portTICK_PERIOD_MS);
    ESP.restart();
  });

  server.on("/update", HTTP_POST, 
    [](AsyncWebServerRequest *request) {
      DEBUG_PRINTLN("OTA Update completed");
      request->send(200, "text/plain", "Update in progress");
    },
    [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
      static bool updateStarted = false;
      
      if (!index) {
        DEBUG_PRINTLN(String("OTA Update: ") + filename);
        updateStarted = true;
        
        int command = U_FLASH;
        if (filename.indexOf("littlefs") >= 0) {
          command = U_SPIFFS;
        }
        if (!Update.begin(UPDATE_SIZE_UNKNOWN, command)) {
          Update.printError(Serial);
          updateStarted = false;
        }
      }
      
      if (updateStarted && Update.write(data, len) != len) {
        Update.printError(Serial);
        updateStarted = false;
      }
      
      if (final) {
        if (updateStarted && Update.end(true)) {
          DEBUG_PRINTLN(String("OTA Update Success: ") + String(index + len) + " bytes");
          request->send(200, "text/plain", "Update successful. Restarting...");
        } else {
          Update.printError(Serial);
          request->send(500, "text/plain", "Update failed. Restarting...");
        }
        vTaskDelay(1000 / portTICK_PERIOD_MS);
        ESP.restart();
      }
    }
  );

  server.on("/update-settings", HTTP_POST, [](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("Update settings requested");
    if (request->hasParam("houseVoltage", true) && request->hasParam("calibrationVal1", true)) {
      String hv = request->getParam("houseVoltage", true)->value();
      String cv1 = request->getParam("calibrationVal1", true)->value();
      String cv2 = request->getParam("calibrationVal2", true)->value();
      String cv3 = request->getParam("calibrationVal3", true)->value();
      String nm = request->getParam("numMeasurements", true)->value();
      String in = request->getParam("interval", true)->value();

      houseVoltage = hv.toDouble();
      calibrationVal1 = cv1.toDouble();
      calibrationVal2 = cv2.toDouble();
      calibrationVal3 = cv3.toDouble();
      numMeasurements = nm.toInt();
      interval = in.toInt();

      emon1.current(ADC_INPUT_1, calibrationVal1);
      emon2.current(ADC_INPUT_2, calibrationVal2);
      emon3.current(ADC_INPUT_3, calibrationVal3);
      initialized = false;
      
      // Fix: Properly handle preferences
      preferences.begin("settings", false);
      preferences.putDouble("houseVoltage", houseVoltage);
      preferences.putDouble("calibrationVal1", calibrationVal1);
      preferences.putDouble("calibrationVal2", calibrationVal2);
      preferences.putDouble("calibrationVal3", calibrationVal3);
      preferences.putInt("numMeasurements", numMeasurements);
      preferences.putInt("interval", interval);
      preferences.end();

      request->send(200, "text/plain", "Settings updated successfully");
    } else {
      request->send(400, "text/plain", "Invalid parameters");
    }
  });

  server.onNotFound([](AsyncWebServerRequest *request) {
    DEBUG_PRINTLN("404 Not Found: " + request->url());
    request->send(404, "text/plain", "Not found");
  });

  server.begin();
  DEBUG_PRINTLN("HTTP server started");
}

void handleOTAUpdates(void *parameters)
{
  ArduinoOTA.setHostname("ESP32-PowerMeter");
  ArduinoOTA.setPassword("your_ota_password"); // Fix: Add OTA password
  
  ArduinoOTA.onStart([]() {
    String type;
    if (ArduinoOTA.getCommand() == U_FLASH) {
      type = "sketch";
    } else {
      type = "filesystem";
    }
    DEBUG_PRINTLN("Start updating " + type);
  });
  
  ArduinoOTA.onEnd([]() {
    DEBUG_PRINTLN("\nEnd");
  });
  
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    DEBUG_PRINTLN("Progress: " + String(progress / (total / 100)) + "%");
  });
  
  ArduinoOTA.onError([](ota_error_t error) {
    DEBUG_PRINTLN("Error[" + String(error) + "]: ");
    if (error == OTA_AUTH_ERROR) {
      DEBUG_PRINTLN("Auth Failed");
    } else if (error == OTA_BEGIN_ERROR) {
      DEBUG_PRINTLN("Begin Failed");
    } else if (error == OTA_CONNECT_ERROR) {
      DEBUG_PRINTLN("Connect Failed");
    } else if (error == OTA_RECEIVE_ERROR) {
      DEBUG_PRINTLN("Receive Failed");
    } else if (error == OTA_END_ERROR) {
      DEBUG_PRINTLN("End Failed");
    }
  });
  
  ArduinoOTA.begin();
  
  while (true) {
    ArduinoOTA.handle();
    vTaskDelay(100 / portTICK_PERIOD_MS); // Fix: Add small delay
  }
}