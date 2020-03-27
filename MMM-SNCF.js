/* Timetable for SNCF transport Module */
/* Magic Mirror
	* Module: MMM-SNCF
	*
	* By Jérome Van Oost
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
        retryDelay: 1 * 10 * 1000,
        initialLoadDelay: 0, // start delay seconds.
        numberDays: 1,
        displayDuration: true,
        displayName: true,
        displayHeaders: true,
    },

    // Define required scripts.
    getStyles: function () {
        return [this.file("css/MMM-SNCF.css")];
    },

    // Define start sequence.
    start: function () {
        Log.info("Starting module: " + this.name);

        if (this.config.debugging) Log.info("DEBUG mode activated");

        this.sendSocketNotification('CONFIG', this.config);
        this.loaded = false;
        this.updateTimer = null;
    },

    // Override dom generator.
    getDom: function () {
        var self = this;

        var wrapper = document.createElement("div");

        if (!this.loaded) {
            wrapper.innerHTML = "Loading next trains...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        var table = document.createElement("table");
        table.className = "small transilien";

        var addStateHeader = false;
        var addDelayHeader = false;

        var rowHeader = document.createElement("tr");
        rowHeader.className = "small th-transilien";
        table.appendChild(rowHeader);

        // adding next schedules
        for (var t in this.transports) {
            var transport = this.transports[t];

            if (this.config.debugging) console.log(transport)

            var row = document.createElement("tr");
            row.className = "small tr-transilien";

            var content = ""

            var stateCell = document.createElement("td");

            if (transport.state == "NO_SERVICE") {
                addStateHeader = true;
                content = "<span class='state'><i class='fa fa-ban aria-hidden='true'></i> Supprimé</span> &nbsp;&nbsp;";
            }
            else if (transport.state != "") {
                addStateHeader = true;
                content = "<span class='state'><i class='fa fa-exclamation-triangle aria-hidden='true'></i> " + transport.state + "</span>  &nbsp;&nbsp;";
            }

            stateCell.innerHTML = content;

            row.appendChild(stateCell);

            var delayCell = document.createElement("td");

            if (transport.delay != "" && transport.delay != null) {
                addDelayHeader = true;
                content = "<span class='state'><i class='fa fa-clock-o aria-hidden='true'></i> " + transport.delay + "</span> &nbsp;&nbsp;";
            }

            delayCell.innerHTML = content;

            row.appendChild(delayCell);

            if (this.config.displayName) {
                var nameCell = document.createElement("td");

                content = "<span class='trainName'>" + transport.name + "</span> &nbsp;&nbsp;";

                nameCell.innerHTML = content;

                row.appendChild(nameCell);
            }

            var dateCell = document.createElement("td");

            if (transport.delay == 0 || transport.delay == null) {
                content = transport.date + "&nbsp;&nbsp;";
            }
            else {
                content = "<span class='oldHoraire'>" + transport.dateTheorique + "</span> &nbsp;&nbsp;";

                if (transport.disruptionInfo !== 0) {
                    content = transport.disruptionInfo.amended_departure_time;
                    content = "<br /><span class='disruptionCause'>" + transport.disruptionInfo.cause + "</span> &nbsp;&nbsp;";
                }
            }

            dateCell.innerHTML = content;

            row.appendChild(dateCell);

            if (this.config.displayDuration) {
                var durationCell = document.createElement("td");

                content = "<span class='trainDuration'>" + self.timeFormatting(transport.duration) + "</span> &nbsp;&nbsp;";

                durationCell.innerHTML = content;

                row.appendChild(durationCell);
            }

            table.appendChild(row);
        }

        if (this.config.displayHeaders) {
            var rowHeader = table.childNodes[0];

            var h1 = document.createElement("th");
            h1.innerHTML = addStateHeader ? "Etat :" : "";
            rowHeader.appendChild(h1);

            var h2 = document.createElement("th");
            h2.innerHTML = addDelayHeader ? "Retard :" : "";
            rowHeader.appendChild(h2);

            if (this.config.displayName) {
                var h3 = document.createElement("th");
                h3.innerHTML = "N° :";
                rowHeader.appendChild(h3);
            }

            var h4 = document.createElement("th");
            h4.innerHTML = "Départ :";
            rowHeader.appendChild(h4);

            if (this.config.displayDuration) {
                var h5 = document.createElement("th");
                h5.innerHTML = "Durée :";
                rowHeader.appendChild(h5);
            }

            table.childNodes[0] = rowHeader;
        }

        return table;
    },

    // using the results retrieved for the API call
    socketNotificationReceived: function (notification, payload) {
        Log.info("Notif:" + notification);
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

    timeFormatting: function (totalMinutes) {
        if (totalMinutes >= 60) {
            var hours = Math.floor(totalMinutes / 60);
            var minutes = totalMinutes % 60;

            return hours + " h " + minutes + " min";
        }
        else {
            return totalMinutes + " min";
        }
    }
});