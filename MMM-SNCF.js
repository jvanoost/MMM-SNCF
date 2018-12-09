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
    useRealtime: true,
    updateInterval: 1 * 60 * 1000, // Update 30 secs
    animationSpeed: 2000,
    debugging: false,
    header: "SNCF",
    retryDelay: 1 * 10 * 1000,
    initialLoadDelay: 0, // start delay seconds.
    trainsdisplayed: 3, // number of trains displayed
  },

  // Define required scripts.
  getStyles: function() {
    return [this.file("css/MMM-SNCF.css")];
  },

  // Define start sequence.
  start: function() {
    Log.info("Starting module: " + this.name);
    if (this.config.debugging) Log.info("DEBUG mode activated");
    this.sendSocketNotification("CONFIG", this.config);
    this.loaded = false;
    this.updateTimer = null;
  },

  // Override dom generator.
  getDom: function() {
    var wrapper = document.createElement("div");

    if (!this.loaded) {
      wrapper.innerHTML = "Loading next trains...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (this.transports.length === 0 && this.loaded) {
      wrapper.innerHTML = "Aucun train aujourd'hui";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    var table = document.createElement("table");
    table.className = "small transilien";

    // adding next schedules
    for (var t in this.transports) {
      var transports = this.transports[t];

      var row = document.createElement("tr");

      var transportNameCell = document.createElement("td");
      var content = "";
      //if(transports.state !== "" )
      //{
      content =
        "<span class='state'><i class='fa fa-clock-o aria-hidden='true'></i> " +
        transports.delay +
        "</span> &nbsp;&nbsp;";
      //}

      content =
        content +
        "<span class='trainname'>" +
        transports.duration +
        " mn</span>";

      content = content + "&nbsp;&nbsp;&nbsp;&nbsp;" + transports.date;
      transportNameCell.innerHTML = content;
      transportNameCell.className = "align-right bright";
      row.appendChild(transportNameCell);

      table.appendChild(row);
    }

    return table;
  },

  // using the results retrieved for the API call
  socketNotificationReceived: function(notification, payload) {
    Log.info("Notif:" + notification);
    if (notification === "TRAINS") {
      if (this.config.debugging) {
        Log.info("Trains received");
        Log.info(payload.transports);
      }
      this.transports = payload.transports;
      this.loaded = true;
      this.updateDom(this.config.animationSpeed);
    }
  },
});
