#include <SPI.h>
#include <WiFi.h>
#include <Wire.h>
#include <RtcDS1307.h>           // v2.3.3  https://github.com/Makuna/Rtc
#include <SdFat.h>               // v1.2.3  https://github.com/adafruit/SdFat
#include <aWOT.h>                // v1.1.0  https://github.com/lasselukkari/aWOT
#include <ClosedCube_HDC1080.h>  // v1.3.2  https://github.com/closedcube/ClosedCube_HDC1080_Arduino/releases
#include "ccs811.h"              // v10.0.0 https://github.com/maarten-pennings/CCS811
#include "StaticFiles.h"

#define BASE_DIR "/airmon"

char ssid[] = "";                // leave empty to disable
char pass[] = "";
char apSsid[] = "AirMonitor";    // leave empty to disable
char apPass[] = "AirMonitor";

int resetPin = 0;                // press the boot mode pin for 5 seconds to reset the measurement history
int recordInterval = 300000;     // 5 minutes
int measurementInterval = 10000; // 10 seconds

int measurementCount = 0;
int failCount = 0;
int maxFails = 5;

int co2;
int tvoc;
float temperature;
float humidity;
int timestamp;

int co2Sum = 0;
int tvocSum = 0;
float temperatureSum = 0.0;
float humiditySum = 0.0;

unsigned long lastMeasurement = 0;
unsigned long lastRecord = 0;

byte * error;

ClosedCube_HDC1080 hdc1080;
CCS811 ccs811(-1);
RtcDS1307<TwoWire> Rtc(Wire);
SdFat SD;
WiFiServer server(80);
Application app;

void setTime(Request &req, Response &res) {
  byte buffer[32];
  if (!req.body(buffer, 32)) {
    return res.sendStatus(400);
  }

  RtcDateTime time = RtcDateTime(atoi((char *)&buffer));
  Rtc.SetDateTime(time);

  lastMeasurement = 0;

  res.sendStatus(204);
}

void getCurrent(Request &req, Response &res) {
  res.set("Content-Type", "application/binary");
  res.write((byte *)&co2, 4);
  res.write((byte *)&tvoc, 4);
  res.write((byte *)&temperature, 4);
  res.write((byte *)&humidity, 4);
  res.write((byte *)&timestamp, 4);
}

void getRange(Request &req, Response &res) {
  char startBuf[16];
  if (!req.query("start", startBuf, 16)) {
    return res.sendStatus(400);
  }

  char endBuf[16];
  if (!req.query("end", endBuf, 16)) {
    return res.sendStatus(400);
  }

  int start = atoi(startBuf);
  int end = atoi(endBuf);

  File root = SD.open(BASE_DIR);
  if (!root) {
    return res.sendStatus(500);
  }

  if (!root.isDirectory()) {
    return res.sendStatus(500);
  }

  File file = root.openNextFile();
  if (!file) {
    return;
  }

  if (file.isDirectory()) {
    return res.sendStatus(500);
  }

  res.set("Content-Type", "application/binary");

  while (file) {
    char filename[16];
    if (!file.getName(filename, 16)) {
      return res.sendStatus(500);
    }

    char epochDay[6];
    strncpy(epochDay, filename, 5);
    epochDay[5] = '\0';

    if (atoi(epochDay) >= start) {
      if (atoi(epochDay) > end) {
        break;
      }

      while (file.available()) {
        res.write(file.read());
      }
    }

    file.close();

    file = root.openNextFile();
  }
}

void runMeasurements() {
  uint16_t eco2, etvoc, errstat, raw;
  ccs811.read(&eco2, &etvoc, &errstat, &raw);

  if (errstat != CCS811_ERRSTAT_OK) {
    return;
  }

  co2 = (int) eco2;
  tvoc =(int) etvoc;
  temperature = hdc1080.readTemperature();
  humidity = hdc1080.readHumidity();
  timestamp = Rtc.GetDateTime().Epoch32Time();

  co2Sum += co2;
  tvocSum += tvoc;
  temperatureSum += temperature;
  humiditySum += humidity;
  failCount = 0;
  measurementCount++;
}

void recordMeasurements() {
  if (measurementCount == 0) {
    return;
  }

  int co2Avg = co2Sum / measurementCount;
  int tvocAvg = tvocSum / measurementCount;
  float temperatureAvg = temperatureSum / measurementCount;
  float humidityAvg = humiditySum / measurementCount;
  int nowTime = Rtc.GetDateTime().Epoch32Time();
  int epochDay = nowTime / 86400;
  char datestring[40];

  snprintf(datestring, 40, BASE_DIR "/%u.bin", epochDay);

  File file = SD.open(datestring, FILE_WRITE);
  if (!file) {
    Serial.println("Failed to open file for appending");
    return;
  }

  file.write((byte *)&co2Avg, 4) &&
  file.write((byte *)&tvocAvg, 4) &&
  file.write((byte *)&temperatureAvg, 4) &&
  file.write((byte *)&humidityAvg, 4) &&
  file.write((byte *)&nowTime, 4) &&
  file.close();

  co2Sum = 0;
  tvocSum = 0;
  temperatureSum = 0;
  humiditySum = 0;
  measurementCount = 0;
}

void removeData() {
  File root = SD.open(BASE_DIR);
  root.rmRfStar();
  SD.mkdir(BASE_DIR);
  Serial.println("All files removed");
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

void setupHardware() {
  pinMode(resetPin, INPUT);

  SD.begin(SS, SD_SCK_MHZ(10));
  SD.mkdir(BASE_DIR);

  Wire.begin();

  Rtc.Begin();
  Rtc.SetIsRunning(true);

  ccs811.set_i2cdelay(50);
  ccs811.begin();
  ccs811.start(CCS811_MODE_10SEC);

  hdc1080.begin(0x40);
}

void setupServer() {
  app.get("/api/current", &getCurrent);
  app.get("/api/history", &getRange);
  app.put("/api/time", &setTime);
  app.route(staticFiles());

  server.begin();
}

void setup() {
  Serial.begin(115200);
  setupAccessPoint();
  setupWifi();
  setupHardware();
  setupServer();
}

void loop() {
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
      removeData();
      break;
    }
  }

  WiFiClient client = server.available();

  if (client.connected()) {
    app.process(&client);
  }
}
