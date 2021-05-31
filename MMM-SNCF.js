/* Timetable for SNCF transport Module */
/* Magic Mirror
* Module: MMM-SNCF
*
* By Jérome Van Oost & abrochet
* based on a script from Louis-Guillaume MORAND - https://github.com/lgmorand/MMM-Transilien#readme
* MIT Licensed.
*/
Module.register("MMM-SNCF", {
    transports: [],

    // Define module defaults
    defaults: {
        updateInterval: 1 * 60 * 1000, // Update 60 secs (API SNCF : 5 000 requêtes/jour)
        animationSpeed: 2000,
        debugging: false,
        lang: config.language,
        dateFormat: 'llll',
        retryDelay: 1 * 10 * 1000,
        initialLoadDelay: 0, // start delay seconds.
        numberDays: 1,
        maxNbTransfers: 10,
        displayDuration: true,
        displayName: true,
        displayDestination: false,
        displayC02: false,
        displayHeaders: true,
    },

    // Define required scripts.
    getStyles: function () {
        return [this.file("css/MMM-SNCF.css")];
    },

    // Load translations files
    getTranslations: function () {
        return {
            en: "translations/en.json",
            fr: "translations/fr.json"
        };
    },

    // Define start sequence.
    start: function () {
        Log.info("Starting module: " + this.name);

        if (this.config.debugging) Log.info("DEBUG mode activated");

        /*** Backward compatibility of parameters ***/

        if (this.config.departUIC != null) {
            this.config.departureStationUIC = this.config.departUIC;
        }

        if (this.config.arriveeUIC != null) {
            this.config.arrivalStationUIC = this.config.arriveeUIC;
        }

        if (this.config.trainsdisplayed != null) {
            this.config.numberDays = this.config.trainsdisplayed;
        }

        if (this.config.login != null) {
            this.config.apiKey = this.config.login;
        }

        /***************************************************/

        this.sendSocketNotification('CONFIG', this.config);

        this.loaded = false;
        this.updateTimer = null;
    },

    // Override dom generator.
    getDom: function () {
        if (!this.loaded) {
            var wrapper = document.createElement("div");
            wrapper.innerHTML = this.translate("loading");
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        var container = document.createElement("div");
        container.className = "small div-transilien";

        if (this.transports.length > 0) {
            var table = document.createElement("table");
            table.className = "small table-transilien";

            var rowHeader = document.createElement("tr");
            rowHeader.className = "tr-heading";
            table.appendChild(rowHeader);

            // adding next schedules
            for (var t in this.transports) {
                var transport = this.transports[t];

                var row = document.createElement("tr");
                row.className = "tr-transilien" + " " + transport.state + " " + transport.endOfJourney;

                if (this.config.displayName) {
                    var nameCell = document.createElement("td");
                    nameCell.className = "td-information";

                    if (transport.type !== "waiting") {
                        nameCell.innerHTML = "<span class='name'><i class='fa fa-train' aria-hidden='true'></i> " + transport.name + "</span><br />";
                    }
                    else {
                        nameCell.innerHTML = "<i class='fas fa-walking' aria-hidden='true'></i>";
                    }

                    row.appendChild(nameCell);
                }

                var dateCell = document.createElement("td");
                dateCell.className = "td-date";

                if (transport.delay == 0 || transport.delay == null) {
                    dateCell.innerHTML = transport.date;
                }
                else {
                    dateCell.innerHTML = "<span class='old-horaire'>" + transport.originalDate + "</span>";

                    if (transport.disruptionInfo !== null) {
                        dateCell.innerHTML += "<br /><span>" + transport.disruptionInfo.amended_departure_time + "</span>"; // Nouvelle heure de départ
                    }
                }

                row.appendChild(dateCell);

                if (this.config.displayDuration) {
                    var durationCell = document.createElement("td");
                    durationCell.className = "td-duration";

                    durationCell.innerHTML = "<span>" + transport.duration + "</span>";

                    row.appendChild(durationCell);
                }

                if (this.config.displayDestination) {
                    var destinationCell = document.createElement("td");
                    destinationCell.className = "td-destination";

                    destinationCell.innerHTML = "<span>" + transport.destination + "</span>";

                    row.appendChild(destinationCell);
                }

                var stateCell = document.createElement("td");
                stateCell.className = "td-peculiarity";

                if (transport.type == "waiting") {
                    stateCell.innerHTML = "<span class='waiting-station'>" + this.translate("waiting") + "</span>";
                }
                else if (transport.state != "") {
					switch (transport.state) {
						case 'SIGNIFICANT_DELAYS':
							stateCell.innerHTML = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i>&nbsp" + this.translate("significant_delay") + "</span>";
						break;						
						case 'REDUCED_SERVICE':
							stateCell.innerHTML = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i>&nbsp" + this.translate("reduced_service") + "</span>";
						break;						
						case 'NO_SERVICE':
							stateCell.innerHTML = "<span class='deleted'><i class='fa fa-ban' aria-hidden='true'></i>&nbsp" + this.translate("no_service") + "</span>";						
						break;
						case 'MODIFIED_SERVICE':
							stateCell.innerHTML = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i>&nbsp" + this.translate("modified_service") + "</span>";						
						break;
						case 'ADDITIONAL_SERVICE':
							stateCell.innerHTML = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i>&nbsp" + this.translate("additional_service") + "</span>";						
						break;
						case 'UNKNOWN_EFFECT':
							stateCell.innerHTML = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i>&nbsp" + this.translate("unknown_effect") + "</span>";						
						break;
						case 'DETOUR':
							stateCell.innerHTML = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i>&nbsp" + this.translate("modified_service") + "</span>";						
						break;
						case 'OTHER_EFFECT':
						default:
							stateCell.innerHTML = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i>&nbsp" + this.translate("other_effect") + "</span>";	
						break;
					}			       
                }
                else if (transport.delay != "" && transport.delay !== null) {
                    stateCell.innerHTML = "<span class='state'><i class='fa fa-clock-o' aria-hidden='true'></i>&nbsp" + this.translate("delay") + "&nbsp" + transport.delay + "</span>";
                }
                else {
                    stateCell.innerHTML = "<span class='on-time'>" + this.translate("on_time") + "</span>";
                }

                if (transport.disruptionInfo !== null) {
                    stateCell.innerHTML += "<br /><span class='disruption-cause'>" + transport.disruptionInfo.cause + "</span>";
                }

                row.appendChild(stateCell);

                if (this.config.displayC02 && transport.c02 != 0) {
                    var c02Cell = document.createElement("td");
                    c02Cell.className = "td-c02";

                    c02Cell.innerHTML = "<span><i class='fa fa-leaf' aria-hidden='true'></i>&nbsp" + transport.c02 + "</span>";

                    row.appendChild(c02Cell);
                }

                table.appendChild(row);
            }

            if (this.config.displayHeaders) {
                var rowHeader = table.childNodes[0];

                if (this.config.displayName) {
                    var h1 = document.createElement("th");
                    h1.className = "th-transilien";
                    h1.innerHTML = this.translate("information");
                    rowHeader.appendChild(h1);
                }

                var h2 = document.createElement("th");
                h2.className = "th-transilien";
                h2.innerHTML = this.translate("departure");
                rowHeader.appendChild(h2);

                if (this.config.displayDuration) {
                    var h3 = document.createElement("th");
                    h3.className = "th-transilien";
                    h3.innerHTML = this.translate("duration");
                    rowHeader.appendChild(h3);
                }

                if (this.config.displayDestination) {
                    var h4 = document.createElement("th");
                    h4.className = "th-transilien";
                    h4.innerHTML = this.translate("destination");
                    rowHeader.appendChild(h4);
                }

                var h5 = document.createElement("th");
                h5.className = "th-transilien";
                h5.innerHTML = this.translate("peculiarities");
                rowHeader.appendChild(h5);

                if (this.config.displayC02) {
                    var h6 = document.createElement("th");
                    h6.className = "th-transilien";
                    h6.innerHTML = this.translate("c02");
                    rowHeader.appendChild(h6);
                }

                table.childNodes[0] = rowHeader;
            }

            container.appendChild(table);
        }
        else {
            container.innerHTML = this.translate("no_route");
        }

        return container;
    },

    // using the results retrieved for the API call
    socketNotificationReceived: function (notification, payload) {
        if (notification === "TRAINS") {
            if (this.config.debugging) {
                Log.info("Trains received");
                Log.info(payload.transports);
            }

            if (payload.id === this.config.id) {
                this.transports = payload.transports;
                this.loaded = true;
            }

            this.updateDom(this.config.animationSpeed);
        }
    },
});
