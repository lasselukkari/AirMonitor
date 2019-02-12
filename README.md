# AirMonitor
AirMonitor is an ESP32/Arduino CO2, temperature and humidity data logger.

By default it logs the measurements every 10 minutes and keeps a history for the past 7 days. Instead of pushing the data to a cloud service AirMonitor persist the historical data to the internal flash memory. To erase the stored data hold the boot mode button for 5 seconds.

The device can be configured to be an access point or it can be connected to another network. The data can be viewed using th build in user interface or intergrated to another system using the JSON REST api.

All dependencies have been vendored in. The sketch directory should be ready for uploading.

## Required Parts
* ESP32 Development Noard
* SHT31-D Temperature & Humidity Sensor
* MH-Z19 Infrared CO2 Sensor

## Wiring
Wired using a standard SHT31-D breakout board. The MH-Z19 uses the serial port.
<img src="https://i.imgur.com/bwVV0hC.png" width="500" />

## User Interface
<img src="https://i.imgur.com/TgfNmmM.png" width="500" />

## REST API
### GET api/current
```json
{  
  "co2": 636,
  "temperature": 27.68,
  "humidity": 28.09,
  "interval": 5000
}
```

### GET api/history
```json
{  
  "co2": [ 658, 656, 653, 649, 647 ],
  "temperature": [ 27.58, 27.60, 27.61, 27.62, 27.63 ],
  "humidity": [ 28.38, 28.34, 28.30, 28.31, 28.29 ],
  "interval": 600000,
  "age": 2717
}
```
