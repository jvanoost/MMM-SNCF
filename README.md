# MMM-SNCF

MMM-SNCF was developped from the ![MMM-Transilien](https://github.com/lgmorand/MMM-Transilien) module.

## WARNING
Due tu SNCF API update, we need to change the API provider which is now [Navitia](https://www.navitia.io/)
You need to create an account there to get a new API token
So your departure station should change
For Lille Flandre, it was
`stop_point:OCE:SP:TrainTER-87286005`
it is now 
`stop_area:STE:SA:OCE87286005`

So I could imagine you could easily find the change you have to make.
You can also fin your new id there : [https://api.navitia.io/v1/coverage/fr-ne/places/?q=Lille Flandre](https://api.navitia.io/v1/coverage/fr-ne/places/?q=Lille%20Flandre)
and find the id you need

Don't forget to update your config.js file and add the **coverage** of your departure zone.

You can also try to play with [navitia playground](https://canaltp.github.io/navitia-playground/play.html) with your token
You can enter this URL to start playing :
`https://api.navitia.io/v1/coverage/fr-ne/journeys?from=stop_area%3ASTE%3ASA%3AOCE87286005&to=stop_area%3ASTE%3ASA%3AOCE87286583&`

## Installation

Clone the git in the /modules folder of Magic Mirror and run the "npm install" command which will installed the required node modules.

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
        dateFormat: 'dddd HH:mm', // display for example with french locale Jeudi 08:43
        displayCo2: true,
        coverage: "fr-ne",
    }
},
```

## Configuration options

The following properties can be configured:

| Option           | Description
| ---------------- | -----------
| `updateInterval` | How often do the trains have to change? (Milliseconds) <br><br> **Possible values:** `1000` - `86400000` <br> **Default value:** `60000` (60 seconds)
| `animationSpeed` | Speed of the update animation. (Milliseconds) <br><br> **Possible values:** `0` - `5000` <br> **Default value:** `2000` (2 seconds)
| `debugging` | Display logs in console. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `retryDelay` | The delay before retrying after a request failure. (Milliseconds) <br><br> **Possible values:** `1000` - `60000` <br> **Default value:** `10000`
| `initialLoadDelay` | The initial delay before loading. If you have multiple modules that use the same API key, you might want to delay one of the requests. (Milliseconds) <br><br> **Possible values:** `1000` - `5000` <br> **Default value:** `0`
| `apiKey` | The [Navitia](https://www.navitia.io/) API key, which can be obtained by creating an Navitia account. <br><br> This value is **REQUIRED**
| `departureStationUIC` | You need to find your station code using the [**Navitia playground**](https://canaltp.github.io/navitia-playground/play.html?request=https%3A%2F%2Fapi.navitia.io%2Fv1%2Fcoverage%2F%257Bregion.id%257D%2Fstop_areas%2F%257Bstop_area.id%257D%2Fdepartures).<br><br> This value is **REQUIRED**
| `arrivalStationUIC` | You need to find your station code using the [**Navitia playground**](https://canaltp.github.io/navitia-playground/play.html?request=https%3A%2F%2Fapi.navitia.io%2Fv1%2Fcoverage%2F%257Bregion.id%257D%2Fstop_areas%2F%257Bstop_area.id%257D%2Fdepartures).<br><br> This value is **REQUIRED**
| `numberDays` | Number of results per day. <br><br> **Default value:** `1` 
| `maxNbTransfers` | Maximum number of transfers in each journey. <br><br> **Default value:** `10` 
| `displayName` | Display train name and type. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `displayDuration` | Display journey time. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `displayDestination` | Display the destination of the train. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false`
| `displayC02` | Display the C02 emissions for your trip. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `false` <br> Warning the option is disabled if the mode option is on '1'.
| `displayHeaders` | Display columns headers. <br><br> **Possible values:** `true` or `false` <br> **Default value:** `true`
| `dateFormat` | Format to use for the date of train.<br> **Caution:**<br>h display hours in 12h format / H in 24h<br>for minutes, it is mm. MM display the month number.<br><br> **Possible values:** [Moment.js formats](https://momentjs.com/docs/#/parsing/string-format/) <br> **Default value:** `llll`
| `coverage` | Coverage of departure station **REQUIRED**<br>[Check your coverage](https://www.navitia.io/datasets) Select a city near your departure station and check the coverage.
| `mode` | Search mode (journeys or departures). <br><br> **Possible values:** `0` (journeys) or `1` (departures) <br> **Default value:** `0` (journeys)

## Further information and support

Please use the forum of magic mirror² [https://forum.magicmirror.builders/](https://forum.magicmirror.builders/)
