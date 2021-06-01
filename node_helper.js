/* Timetable for SNCF train Module
 * Magic Mirror
 * Module: MMM-SNCF
 *
 * By Jerome Van Oost & abrochet
 * MIT Licensed.
 */
const NodeHelper = require("node_helper");
const unirest = require('unirest');
const moment = require('moment');

module.exports = NodeHelper.create({
    updateTimer: "",
    start: function() {
        this.started = false;
        console.log("\r\nMMM-SNCF- NodeHelper started");
    },

    /* updateTimetable(transports)
     * Calls processTransports on succesfull response.
     */
    updateTimetable: function() {
        var that = this;
        var retry = false;
        var url = null;

        switch (this.config.mode) {
            case 1:
                url = "https://api.navitia.io/v1/coverage/" + this.config.coverage + "/stop_areas/" + this.config.departureStationUIC + "/departures?";
                break;
            case 0:
            default:
                url = "https://api.navitia.io/v1/coverage/" + this.config.coverage + "/journeys?from=" + this.config.departureStationUIC + "&to=" + this.config.arrivalStationUIC + "&datetime=" + moment().toISOString() + "&count=" + this.config.numberDays + "&max_nb_transfers=" + this.config.maxNbTransfers;
                break;
        }

        if (this.config.debugging) console.log(url);

        // calling this API
        var request = unirest.get(url);

        request.headers({
            'Authorization': (this.config.apiKey),
        });

        // from the documentation of the api, it'll be mandatory in next version of the api
        request.end(function(r) {
            if (r.error) {
                if (this.config.debugging) {
                    console.log(this.name + " : " + r.error);
                    console.log(r.body); // Display error
                }
                retry = true;
            } else {
                that.processTransports(r.body);
            }

            if (retry) {
                this.scheduleUpdate((this.loaded) ? -1 : this.config.retryDelay);
            }
        });
    },

    /* getDisruptionInfo()
     * Retrieve informations from disruption and departure time
     * argument disruption - list of all disruptions
     * argument idSearched - Id which we want info
     */
    getDisruptionInfo: function(disruptions, idSearched) {
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
    processTransports: function(data) {
        this.transports = [];

        moment.locale(this.config.lang);

        // we search if there are disruptions
        if (data.disruptions) {
            disruptions = data.disruptions;
        } else {
            disruptions = 0;
        }

        if (this.config.debugging) console.log("Data : " + this.data);

        switch (this.config.mode) {
            case 1:
                this.trainDepartures(data.departures);
                break;
            case 0:
            default:
                this.trainJourneys(data.journeys);
                break;
        }

        if (this.config.debugging) console.log("Length transport : " + this.transports.length);

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
    scheduleUpdate: function(delay) {
        var that = this;
        var nextLoad = this.config.updateInterval;

        if (typeof delay !== "undefined" && delay > 0) {
            if (this.config.debugging) console.log("Delay : " + delay);
            nextLoad = delay;
        }

        clearTimeout(this.updateTimer);

        this.updateTimer = setInterval(function() {
            that.updateTimetable();
        }, nextLoad);
    },

    socketNotificationReceived: function(notification, payload) {
        if (payload.debugging) {
            console.log("Notif received: " + notification);
            console.log(payload);
        }

        if (notification === 'CONFIG' && this.started == false) {
            this.config = payload;
            this.started = true;
            this.scheduleUpdate(this.config.initialLoadDelay);
        }
    },

    c02Emission: function(unit, c02) {
        if (unit == "gEC" && c02 > 0) {
            var emission = c02 / 1000;

            return emission.toFixed(2) + " kg";
        }

        return c02;
    },

    timeFormatting: function(totalMinutes) {
        if (totalMinutes >= 60) {
            var hours = Math.floor(totalMinutes / 60);
            var minutes = totalMinutes % 60;

            return hours + " h " + minutes + " min";
        } else if (totalMinutes > 0) {
            return totalMinutes + " min";
        }

        return null;
    },

    findDestination: function(section) {
        var destination = "";

        if (section.from !== undefined && section.to !== undefined) {
            if (section.from.embedded_type == "stop_area") {
                destination += section.from.stop_area.name;
            } else if (section.from.embedded_type == "stop_point") {
                destination += section.from.stop_point.name;
            }

            destination += " -> ";

            if (section.to.embedded_type == "stop_area") {
                destination += section.to.stop_area.name;
            } else if (section.to.embedded_type == "stop_point") {
                destination += section.to.stop_point.name;
            }

            if (this.config.debugging) console.log("Destination : " + destination);
        }

        return destination;
    },

    isEndOfTheDay: function(to) {
        if (to !== undefined) {
            var id = null;

            if (to.embedded_type == "stop_area" && to.stop_area !== undefined) {
                if (this.config.debugging) console.log("Station code : " + to.stop_area.id);

                id = to.stop_area.id;
            } else if (to.embedded_type == "stop_point" && to.stop_point.stop_area !== undefined) {
                if (this.config.debugging) console.log("Station code : " + to.stop_point.stop_area.id);

                id = to.stop_point.stop_area.id;
            }

            if (this.config.arrivalStationUIC == id) {
                return "END_JOURNEY";
            }
        }

        return "NOT_END_JOURNEY";
    },

    trainDepartures: function(departures) {
        if (departures !== undefined) {
            for (var i = 0; i < departures.length; i++) {
                if (departures[i] !== undefined) {
                    var date = departures[i].stop_date_time.departure_date_time;
                    var originalDate = departures[i].stop_date_time.base_departure_date_time;

                    // on récupère l'id de la disruptionMessage
                    var idDisruption = 0;
                    var alert = "";

                    if (alert.length > 0) {
                        if (alert[0].type == 'disruption') {
                            idDisruption = alert[0].id;
                        }
                    }

                    // on parcours les disruption jusqu'a retrouver la bonne
                    var disruptionInfo = null;

                    if (disruptions.length > 0) {
                        disruptionInfo = {};

                        // Searching our disruption ID in all disruption
                        for (var j = 0; j < disruptions.length; j++) {
                            if (disruptions[j].disruption_id == idDisruption) {
                                // Searching our depart stop in List of impacted stops
                                var impactedStops = disruptions[j].impacted_objects[0].impacted_stops;

                                for (var k = 0; k < impactedStops.length; k++) {
                                    if (impactedStops[k].stop_point.id == this.config.departureStationUIC) {
                                        disruptionInfo['amended_departure_time'] = date.substring(0, 9) + impactedStops[k].amended_departure_time;
                                        disruptionInfo['amended_departure_time'] = disruptionInfo['amended_departure_time'].substring(disruptionInfo['amended_departure_time'].lastIndexOf(" ") + 1);
                                        disruptionInfo['amended_departure_time'] = moment(disruptionInfo['amended_departure_time']).format(this.config.dateFormat);
                                        disruptionInfo['cause'] = impactedStops[k].cause;

                                        if (this.config.debugging) console.log(disruptionInfo);
                                    }
                                }
                            }
                        }
                    }

                    if (disruptionInfo !== null && disruptionInfo.hasOwnProperty("amended_departure_time")) {
                        date = disruptionInfo.amended_departure_time;
                        date = date.substring(date.lastIndexOf(" ") + 1);
                    } else {
                        date = date.substring(date.lastIndexOf(" ") + 1);
                    }

                    var delay = 0;

                    if (originalDate !== undefined && date !== undefined) {
                        if (this.config.debugging) console.log("Date : " + date);
                        if (this.config.debugging) console.log("Original date : " + originalDate);

                        originalDate = originalDate.substring(originalDate.lastIndexOf(" ") + 1);

                        delay = moment(date).diff(moment(originalDate), "minutes");
                    }

                    this.transports.push({
                        name: departures[i].display_informations !== undefined ? departures[i].display_informations.commercial_mode + " N°" + departures[i].display_informations.headsign : "ND",
                        //type: departures[i].type,
                        date: date !== undefined ? moment(date).format(this.config.dateFormat) : null,
                        originalDate: originalDate !== undefined ? moment(originalDate).format(this.config.dateFormat) : null,
                        destination: departures[i].display_informations.direction,
                        //duration: this.timeFormatting(departures[i].duration / 60), // duration in minutes
                        delay: this.timeFormatting(delay),
                        disruptionInfo: disruptionInfo,
                        //state: departures[i].status,
                        //endOfJourney: this.isEndOfTheDay(departures[i].to),
                        //c02: this.c02Emission(departures[i].co2_emission.unit, departures[i].co2_emission.value),
                    });
                }
            }
        }
    },

    trainJourneys: function(journeys) {
        if (journeys !== undefined) {
            for (var i = 0; i < journeys.length; i++) {
                if (journeys[i] !== undefined) {
                    // Parcours des trajets (Train + attente)
                    for (var j = 0; j < journeys[i].sections.length; j++) {
                        var section = journeys[i].sections[j];

                        if (this.config.debugging) console.log("Mode : " + section.mode);
                        if (this.config.debugging) console.log("Type : " + section.type);

                        if (section.mode != "walking") {
                            var date = section.departure_date_time;
                            var originalDate = section.base_departure_date_time;

                            // on récupère l'id de la disruptionMessage
                            var idDisruption = 0;
                            var alert = "";

                            if (alert.length > 0) {
                                if (alert[0].type == 'disruption') {
                                    idDisruption = alert[0].id;
                                }
                            }

                            // on parcours les disruption jusqu'a retrouver la bonne
                            var disruptionInfo = null;

                            if (disruptions.length > 0) {
                                disruptionInfo = {};

                                // Searching our disruption ID in all disruption
                                for (var k = 0; k < disruptions.length; k++) {
                                    if (disruptions[k].disruption_id == idDisruption) {
                                        // Searching our depart stop in List of impacted stops
                                        var impactedStops = disruptions[k].impacted_objects[0].impacted_stops;

                                        for (var l = 0; l < impactedStops.length; l++) {
                                            if (impactedStops[l].stop_point.id == this.config.departureStationUIC) {
                                                disruptionInfo['amended_departure_time'] = date.substring(0, 9) + impactedStops[l].amended_departure_time;
                                                disruptionInfo['amended_departure_time'] = disruptionInfo['amended_departure_time'].substring(disruptionInfo['amended_departure_time'].lastIndexOf(" ") + 1);
                                                disruptionInfo['amended_departure_time'] = moment(disruptionInfo['amended_departure_time']).format(this.config.dateFormat);
                                                disruptionInfo['cause'] = impactedStops[l].cause;

                                                if (this.config.debugging) console.log(disruptionInfo);
                                            }
                                        }
                                    }
                                }
                            }

                            if (disruptionInfo !== null && disruptionInfo.hasOwnProperty("amended_departure_time")) {
                                date = disruptionInfo.amended_departure_time;
                                date = date.substring(date.lastIndexOf(" ") + 1);
                            } else {
                                date = date.substring(date.lastIndexOf(" ") + 1);
                            }

                            var delay = 0;

                            if (originalDate !== undefined && date !== undefined) {
                                if (this.config.debugging) console.log("Date : " + date);
                                if (this.config.debugging) console.log("Original date : " + originalDate);

                                originalDate = originalDate.substring(originalDate.lastIndexOf(" ") + 1);

                                delay = moment(date).diff(moment(originalDate), "minutes");
                            }

                            this.transports.push({
                                name: section.display_informations !== undefined ? section.display_informations.commercial_mode + " N°" + section.display_informations.headsign : "ND",
                                type: section.type,
                                date: section.type != "waiting" && date !== undefined ? moment(date).format(this.config.dateFormat) : null,
                                originalDate: section.type != "waiting" && originalDate !== undefined ? moment(originalDate).format(this.config.dateFormat) : null,
                                destination: this.findDestination(section),
                                duration: this.timeFormatting(section.duration / 60), // duration in minutes
                                delay: this.timeFormatting(delay),
                                disruptionInfo: disruptionInfo,
                                state: journeys[i].status,
                                endOfJourney: this.isEndOfTheDay(section.to),
                                c02: this.c02Emission(section.co2_emission.unit, section.co2_emission.value),
                            });
                        }
                    }
                }
            }
        }
    },
});