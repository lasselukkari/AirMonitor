# AirMonitor
AirMonitor is an ESP32/Arduino CO2, TVOC, temperature and humidity data logger.

The device can be configured to be an access point or it can be connected to another network. The data can be viewed using th build in html user interface.

## Parts
* ESP32 development board
* MicroSD card module
* DS1307 RTC module
* HDC1080 temperature & humidity sensor module
* CCS811 gas sensor module

### Libraries
The sketch directory is ready for uploading after you have installed the required libraries.

* [Rtc](https://github.com/Makuna/Rtc)
* [SdFat](https://github.com/adafruit/SdFat)
* [aWOT](https://github.com/lasselukkari/aWOT)
* [ClosedCube HDC1080](https://github.com/closedcube/ClosedCube_HDC1080_Arduino)
* [SparkFun_CCS811](https://github.com/sparkfun/SparkFun_CCS811_Arduino_Library)

## User Interface
<img src="https://i.imgur.com/JcDaDQT.jpg" width="500" />
