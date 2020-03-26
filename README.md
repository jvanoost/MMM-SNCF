# MMM-SNCF

MMM-SNCF was developped from the ![MMM-Transilien](https://github.com/lgmorand/MMM-Transilien) module.

## Installation

Clone the git in the /modules folder of Magic Mirror and run the "npm install" command which will installed the required node modules

## Example

![Module SNCF](https://github.com/abrochet/MMM-SNCF/blob/master/screenshots/transilien.png)

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

```javascript
{
    module: 'MMM-SNCF',
    position: 'top_right',
    header: 'Lille-Flandres to Orchies',
    config:{
        departUIC: "stop_area:OCE:SA:87286005",
        arriveeUIC: "stop_area:OCE:SA:87286583",
        trainsdisplayed: '5',
        apiKey: "", // You must add your API key
    }
},
```

## Configuration options

The following properties can be configured:

| Option           | Description
| ---------------- | -----------
| `updateInterval` | 
| `animationSpeed` | Speed of the update animation. (Milliseconds) <br><br> **Possible values:**`0` - `5000` <br> **Default value:** `2000` (2 seconds)
| `debugging` | 
| `retryDelay` | 
| `initialLoadDelay` | 
| `apiKey` | The [SNCF](https://www.digital.sncf.com/startup/api) API key, which can be obtained by creating an SNCF account. <br><br> This value is **REQUIRED**
| `departUIC` | You need to find your train station and find the **UIC** of the train station (*not the uic7 column, the UIC*). You can look [here](https://ressources.data.sncf.com/explore/dataset/referentiel-gares-voyageurs)
| `arriveeUIC` | You need to find your train station and find the **UIC** of the train station (*not the uic7 column, the UIC*). You can look [here](https://ressources.data.sncf.com/explore/dataset/referentiel-gares-voyageurs)
| `trainsdisplayed` |

## Further information and support

Please use the forum of magic mirror² [https://forum.magicmirror.builders/](https://forum.magicmirror.builders/)
