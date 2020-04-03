# MMM-SNCF

MMM-SNCF was developped from the ![MMM-Transilien](https://github.com/lgmorand/MMM-Transilien) module.

## Installation

Clone the git in the /modules folder of Magic Mirror and run the "npm install" command which will installed the required node modules

## Example

Transfer route:

![Module SNCF](https://github.com/abrochet/MMM-SNCF/blob/master/screenshots/transilien.png)

Unmatched trip:

![Module SNCF](https://github.com/abrochet/MMM-SNCF/blob/master/screenshots/transilien_2.png) 

No train available:

![Module SNCF](https://github.com/abrochet/MMM-SNCF/blob/master/screenshots/transilien_3.png)

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

```javascript
{
    module: 'MMM-SNCF',
    position: 'top_right',
    header: 'Lille-Flandres to Orchies',
    config:{
        departureStationUIC: "stop_area:OCE:SA:87286005",
        arrivalStationUIC: "stop_area:OCE:SA:87286583",
        apiKey: "", // You must add your API key
	numberDays: 2,
        dateFormat: 'dddd HH:MM',
        displayCo2: true,
    }
},
```

## Configuration options

The following properties can be configured:

| Option           | Description
| ---------------- | -----------
| `updateInterval` | How often do the trains have to change? (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `60000` (60 seconds)
| `animationSpeed` | Speed of the update animation. (Milliseconds) <br><br> **Possible values:**`0` - `5000` <br> **Default value:** `2000` (2 seconds)
| `debugging` | Display logs in console. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `retryDelay` | The delay before retrying after a request failure. (Milliseconds) <br><br> **Possible values:** `1000` - `60000` <br> **Default value:** `10000`
| `initialLoadDelay` | The initial delay before loading. If you have multiple modules that use the same API key, you might want to delay one of the requests. (Milliseconds) <br><br> **Possible values:** `1000` - `5000` <br> **Default value:** `0`
| `apiKey` | The [SNCF](https://www.digital.sncf.com/startup/api) API key, which can be obtained by creating an SNCF account. <br><br> This value is **REQUIRED**
| `departureStationUIC` | You need to find your train station and find the [**UIC**](https://ressources.data.sncf.com/explore/dataset/referentiel-gares-voyageurs) of the train station (*not the uic7 column, the UIC*).<br><br> This value is **REQUIRED**
| `arrivalStationUIC` | You need to find your train station and find the [**UIC**](https://ressources.data.sncf.com/explore/dataset/referentiel-gares-voyageurs) of the train station (*not the uic7 column, the UIC*).<br><br> This value is **REQUIRED**
| `numberDays` | Number of results per day. <br><br> **Default value:** `1` 
| `maxNbTransfers` | Maximum number of transfers in each journey. <br><br> **Default value:** `10` 
| `displayName` | Display train name and type. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `displayDuration` | Display journey time. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `displayDestination` | Display the destination of the train. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `displayC02` | Display the C02 emissions for your trip. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `displayHeaders` | Display columns headers. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `dateFormat` | Format to use for the date of train. <br><br> **Possible values:** [Moment.js formats](https://momentjs.com/docs/#/parsing/string-format/) <br> **Default value:** `llll`

## Further information and support

Please use the forum of magic mirror² [https://forum.magicmirror.builders/](https://forum.magicmirror.builders/)
