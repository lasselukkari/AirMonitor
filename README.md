# AirMonitor
AirMonitor is an ESP8266 based CO2, TVOC, temperature and humidity data logger.

The device can be configured to be an access point or it can be connected to another network. The data can be viewed using the build in html user interface. It does not require an Internet connection or any other applications.

<img src="https://i.imgur.com/puXjko8.png" width="100%" />

Note: The CO2 and TVOC will drift in the long run. To get better results use a more expensive sensor for these measurementes.

## Hardware
<img src="https://i.imgur.com/jmF6enj.jpg" width="600" />

* ESP8266 development board
* MicroSD card + DS1307 RTC module
* HDC1080 + CCS811 gas sensor module
* SSD1306 display 

### Libraries
The sketch directory is ready for uploading after you have installed the required libraries.

* [Rtc](https://github.com/Makuna/Rtc)
* [aWOT](https://github.com/lasselukkari/aWOT)
* [HDC1080](https://github.com/closedcube/ClosedCube_HDC1080_Arduino)
* [CCS811](https://github.com/maarten-pennings/CCS811)
* [NTPClient](https://github.com/arduino-libraries/NTPClient)


