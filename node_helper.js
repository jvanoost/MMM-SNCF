/* Timetable for SNCF train Module */
/* Magic Mirror
	* Module: MMM-SNCF
	*
	* By Jerome Van Oost
	* MIT Licensed.
*/
const NodeHelper = require("node_helper");
const unirest = require('unirest');
const moment = require('moment');

module.exports = NodeHelper.create({
    updateTimer: "",
    start: function () {
        this.started = false;
        console.log("\r\nMMM-SNCF- NodeHelper started");
    },

    /* updateTimetable(transports)
		* Calls processTransports on succesfull response.
	*/
    updateTimetable: function () {
        var url = "https://api.sncf.com/v1/coverage/sncf/journeys?from=" + this.config.departureStationUIC + "&to=" + this.config.arrivalStationUIC + "&datetime=" + moment().toISOString() + "&count=" + this.config.numberDays;

        if (this.config.debugging) console.log(url);

        var self = this;
        var retry = false;

        // calling this API
        var request = unirest.get(url);

        request.headers({
            'Authorization': (this.config.apiKey),
        });

        // from the documentation of the api, it'll be mandatory in next version of the api
        request.end(function (r) {
            if (r.error) {
                console.log(self.name + " : " + r.error);
                console.log(r.body); // affiche le corps de l'erreur
                retry = true;
            } else {
                self.processTransports(r.body);
            }

            if (retry) {
                console.log("retrying");
                self.scheduleUpdate((self.loaded) ? -1 : this.config.retryDelay);
            }
        });
    },

    /* getDisruptionInfo()
        * Retrieve informations from disruption and departure time
        * argument disruption - list of all disruptions
        * argument idSearched - Id which we want info
    */
    getDisruptionInfo: function (disruptions, idSearched) {
        // Searching our disruption ID in all disruption
        for (var i = 0; i < disruptions.length; i++) {
            if (disruptions[i].disruption_id == idSearched) {
                var _disruptionInfo = {};
                // Searching our depart stop in List of impacted stops
                var _impactedStops = disruptions[i].impacted_objects[0].impacted_stops;
                for (var j = 0; j < _impactedStops.length; j++) {
                    if (_impactedStops[j].stop_point.id == this.config.departureStationUIC) {
                        _disruptionInfo['amended_departure_time'] = _impactedStops[j].amended_departure_time;
                        _disruptionInfo['cause'] = _impactedStops[j].cause;

                        return _disruptionInfo;
                    }
                }
            }
        }
    },

    /* processTransports(data)
        * Uses the received data to set the various values.
    */
    processTransports: function (data) {
        this.transports = [];
        moment.locale(this.config.language);

        // we don't want to return too much trains
        responseInJson = data.journeys;

        // we search if there are disruptions
        if (data.disruptions) {
            disruptions = data.disruptions;
        }
        else {
            disruptions = 0;
        }

        var count = this.config.numberDays;

        if (responseInJson.length < count) {
            count = responseInJson.length;
        }

        for (var i = 0; i < count; i++) {
            var nextTrain = responseInJson[i];

            if (nextTrain !== undefined) {
                for (var j = 0; j < nextTrain.sections.length; j++) {
                    if (nextTrain.sections[j].mode != "walking") {
                        var _date = '' + nextTrain.sections[j].departure_date_time;
                        var _dateTheorique = '' + nextTrain.sections[j].base_departure_date_time;
                        var _alert = "";

                        if (nextTrain.sections[j].display_informations !== undefined) {
                            nextTrain.sections[j].display_informations.links;
                        }

                        // on récupère l'id de la disruptionMessage
                        var _idDisruption = 0;
                        if (_alert.length > 0) {
                            if (_alert[0].type == 'disruption') {
                                _idDisruption = _alert[0].id;
                            }
                        }
						
                        // on parcours les disruption jusqu'a retrouver la bonne
                        var _disruptionInfo = 0;

                        if (disruptions.length > 0) {
                            _disruptionInfo = {};
							
                            // Searching our disruption ID in all disruption
                            for (var k = 0; k < disruptions.length; k++) {
                                if (disruptions[k].disruption_id == _idDisruption) {
                                    // Searching our depart stop in List of impacted stops
                                    var _impactedStops = disruptions[k].impacted_objects[0].impacted_stops;
                              
                                    for (var l = 0; l < _impactedStops.length; l++) {
                                        if (_impactedStops[l].stop_point.id == this.config.departureStationUIC) {
                                            _disruptionInfo['amended_departure_time'] = _date.substring(0, 9) + _impactedStops[l].amended_departure_time;
                                            _disruptionInfo['amended_departure_time'] = _disruptionInfo['amended_departure_time'].substring(_disruptionInfo['amended_departure_time'].lastIndexOf(" ") + 1);
                                            _disruptionInfo['amended_departure_time'] = moment(_disruptionInfo['amended_departure_time']).format('llll');
                                            _disruptionInfo['cause'] = _impactedStops[l].cause;
                                        }
                                    }
                                }
                            }
                            console.log("\r\nDisruption info: ");
                            console.log(_disruptionInfo);
                        }

                        if (_disruptionInfo !== 0 && _disruptionInfo.hasOwnProperty("amended_departure_time")) {
                            _date = _disruptionInfo.amended_departure_time;
                            _date = _date.substring(_date.lastIndexOf(" ") + 1);
                        }
                        else {
                            _date = _date.substring(_date.lastIndexOf(" ") + 1);
                        }

                        _dateTheorique = _dateTheorique.substring(_dateTheorique.lastIndexOf(" ") + 1);

                        var _delay = moment(_date).diff(moment(_dateTheorique), "minutes");

                        this.transports.push({
                            name: (nextTrain.sections[j].display_informations !== undefined) ? nextTrain.sections[j].display_informations.headsign : "ND",
                            date: moment(_date).format('llll'),
                            dateTheorique: moment(_dateTheorique).format('llll'),
                            duration: nextTrain.sections[j].duration / 60, // duration in minutes
                            delay: _delay,
                            disruptionInfo: _disruptionInfo,
                            state: nextTrain.status
                        });
                    }
                }
            }
        }

        this.loaded = true;
        this.sendSocketNotification("TRAINS", {
            id: this.config.id,
            transports: this.transports
        });
    },

    /* scheduleUpdate()
        * Schedule next update.
        * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
    */
    scheduleUpdate: function (delay) {
        var nextLoad = this.config.updateInterval;

        if (typeof delay !== "undefined" && delay > 0) {
            nextLoad = delay;
        }

        var self = this;

        clearTimeout(this.updateTimer);

        this.updateTimer = setInterval(function () {
            self.updateTimetable();
        }, nextLoad);
    },

    socketNotificationReceived: function (notification, payload) {
        if (payload.debugging) {
            console.log("Notif received: " + notification);
            console.log(payload);
        }

        const self = this;

        if (notification === 'CONFIG' && this.started == false) {
            this.config = payload;
            this.started = true;
            self.scheduleUpdate(this.config.initialLoadDelay);
        }
    }
});