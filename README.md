# MMM-SNCF

MMM-SNCF was developped from the MMM-Transilien module (https://github.com/lgmorand/MMM-Transilien)

## SNCF OpenData

A law was voted to force public companies to open some of their data to the public.

**VERY IMPORTANT**
They sucks at SNCF and they force you to ask for a key to use the API. For that, you need to ask them a key by email (see link above), once you write a mail, you MAY receive a key after several days or weeks (because they really really suck...). It may change in the future but for now they clearly do that to prevent user to easily access to their API.

[Ask for a key](https://www.digital.sncf.com/startup/api)

## Installation

Clone the git in the /modules folder of Magic Mirror and run the "npm install" command which will installed the required node modules

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
| `animationSpeed` | 
| `debugging` | 
| `retryDelay` | 
| `initialLoadDelay` | 
| `apiKey` | 
| `departUIC` | 
| `arriveeUIC` | 
| `trainsdisplayed` |

## Example

1- You need to find your train station and find the **UIC** of the train station (*not the uic7 column, the UIC*). You can look [here](https://ressources.data.sncf.com/explore/dataset/referentiel-gares-voyageurs)

2- Specify missing values in the configuration. You need the UIC of your train station and the UIC of the arrival station.

3- Don't forget to add login/password, which are the credentials to access the API. You can try them in your browser by trying to open the url [https://api.sncf.com/v1](https://api.sncf.com/v1)


## Further information and support

Please use the forum of magic mirror² [https://forum.magicmirror.builders/](https://forum.magicmirror.builders/)
