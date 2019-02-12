#include <WiFi.h>
#include <Wire.h>
#include <FS.h>
#include <SPIFFS.h>

#include "aJSON.h"
#include "aWOT.h"
#include "MHZ19.h"
#include "Adafruit_SHT31.h"

char ssid[] = "";               // leave empty to disable
char pass[] = "";
char apSsid[] = "AirMonitor";   // leave empty to disable
char apPass[] = "AirMonitor";

int resetPin = 0;               // press the boot mode pin for 5 seconds to reset the measurement history
int rxPin = 16;                 // RX2
int txPin = 17;                 // TX2

int historyLenght = 1008;       // minutes in a week / 10
int recordInterval = 600000;    // ten minutes
int measurementInterval = 5000; // five seconds

int measurementCount = 0;
int failCount = 0;
int maxFails = 5;

int co2Sum = 0;
float temperatureSum = 0.0;
float humiditySum = 0.0;

unsigned long lastMeasurement = 0;
unsigned long lastRecord = 0;

aJsonObject* current;
aJsonObject* history;

WiFiServer server(80);
WebApp app;
MHZ19_uart mhz19;
Adafruit_SHT31 sht31;

void getCurrent(Request &req, Response &res) {
  res.success("application/json");
  aJsonStream stream(&res);
  aJson.print(current, &stream);
}

void getHistory(Request &req, Response &res) {
  res.success("application/json");
  aJson.getObjectItem(history, "age")->valueint = millis() - lastRecord;
  aJsonStream stream(&res);
  aJson.print(history, &stream);
}

void runMeasurements() {
  int co2 = mhz19.getPPM();
  float temperature = sht31.readTemperature();
  float humidity = sht31.readHumidity();

  if (co2 != -1) {
    aJson.getObjectItem(current, "co2")->valueint = co2;
    aJson.getObjectItem(current, "temperature")->valuefloat = temperature;
    aJson.getObjectItem(current, "humidity")->valuefloat = humidity;

    co2Sum += co2;
    temperatureSum += temperature;
    humiditySum += humidity;
    failCount = 0;
    measurementCount++;
  } else if (failCount++ == maxFails) {
    ESP.restart();
  }
}

void recordMeasurements() {
  if (measurementCount == 0) {
    return;
  }

  aJsonObject* co2 = aJson.getObjectItem(history, "co2");
  aJsonObject* co2Average = aJson.createItem(co2Sum / measurementCount);
  aJson.addItemToArray( co2, co2Average);
  while (aJson.getArraySize(co2) > historyLenght) {
    aJson.deleteItemFromArray(co2, 0);
  }
  co2Sum = 0;

  aJsonObject* temperature = aJson.getObjectItem(history, "temperature");
  aJsonObject* temperatureAverage = aJson.createItem(temperatureSum / measurementCount);
  aJson.addItemToArray(temperature, temperatureAverage);
  while (aJson.getArraySize(temperature) > historyLenght) {
    aJson.deleteItemFromArray(temperature, 0);
  }
  temperatureSum = 0;

  aJsonObject* humidity = aJson.getObjectItem(history, "humidity");
  aJsonObject* humidityAverage = aJson.createItem(humiditySum / measurementCount);
  aJson.addItemToArray(humidity, humidityAverage);
  while (aJson.getArraySize(humidity) > historyLenght) {
    aJson.deleteItemFromArray(humidity, 0);
  }
  humiditySum = 0;

  measurementCount = 0;

  File file = SPIFFS.open("/history.json", FILE_WRITE);
  aJsonStream stream(&file);
  aJson.print(history, &stream);
  file.close();
}

void setupMeasurements() {
  SPIFFS.begin(true);
  File file = SPIFFS.open("/history.json");
  aJsonStream stream(&file);
  history = aJson.parse(&stream);
  file.close();

  if (!history) {
    history = aJson.createObject();
    aJson.addItemToObject(history, "co2", aJson.createArray());
    aJson.addItemToObject(history, "temperature", aJson.createArray());
    aJson.addItemToObject(history, "humidity", aJson.createArray());
    aJson.addNumberToObject(history, "interval", recordInterval);
    aJson.addNumberToObject(history, "age", 0);
  } else {
    aJson.getObjectItem(history, "interval")->valueint = recordInterval;
  }

  current = aJson.createObject();
  aJson.addNumberToObject(current, "co2", 0);
  aJson.addNumberToObject(current, "temperature", 0.0);
  aJson.addNumberToObject(current, "humidity", 0.0);
  aJson.addNumberToObject(current, "interval", measurementInterval);
}

void setupAccessPoint() {
  if ((apSsid != NULL) && (apSsid[0] != '\0')) {
    WiFi.softAP(apSsid, apPass);
    Serial.print("Access point IP: ");
    Serial.println(WiFi.softAPIP());
  }
}

void setupWifi() {
  if ((ssid != NULL) && (ssid[0] != '\0')) {
    WiFi.begin(ssid, pass);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start <= 10000) {
      delay(500);
      Serial.print(".");
    }
    Serial.println();

    Serial.print("Network IP: ");
    Serial.println(WiFi.localIP());
  }
}

void setupInputs() {
  pinMode(resetPin, INPUT);

  sht31.begin(0x44);

  mhz19.begin(rxPin, txPin);
  mhz19.setAutoCalibration(false);
}

void setupServer() {
  app.get("api/current", &getCurrent);
  app.get("api/history", &getHistory);
  app.use(staticFiles());

  server.begin();
}

void setup() {
  Serial.begin(115200);
  setupAccessPoint();
  setupWifi();
  setupMeasurements();
  setupInputs();
  setupServer();
}

void loop() {
  WiFiClient client = server.available();

  if (client.connected()) {
    app.process(&client);
  }

  unsigned long now = millis();

  if (now - lastMeasurement > measurementInterval) {
    lastMeasurement = now;
    runMeasurements();
  }

  if (now - lastRecord > recordInterval) {
    lastRecord = now;
    recordMeasurements();
  }

  while (digitalRead(resetPin) == LOW) {
    if (millis() - now > 5000) {
      SPIFFS.remove("/history.json");
      ESP.restart();
    }
  }
}
