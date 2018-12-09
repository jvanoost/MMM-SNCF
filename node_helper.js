/* Timetable for SNCF train Module */
/* Magic Mirror
 * Module: MMM-SNCF
 *
 * By Jerome Van Oost
 * MIT Licensed.
 */
const NodeHelper = require("node_helper");
const forge = require("node-forge");
const unirest = require("unirest");
const moment = require("moment");

function btoa(str) {
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = new Buffer(str.toString(), "binary");
  }

  return buffer.toString("base64");
}

module.exports = NodeHelper.create({
  updateTimer: "",
  start: function() {
    this.started = false;
    console.log("\r\nMMM-SNCF- NodeHelper started");
    // console.log("\r\nMMM-SNCF- Debug mode enabled: "+this.config.debugging +"\r\n");
  },

  /* updateTimetable(transports)
   * Calls processTransports on succesfull response.
   */
  updateTimetable: function() {
    var url =
      "https://api.sncf.com/v1/coverage/sncf/journeys?from=" +
      this.config.departUIC +
      "&to=" +
      this.config.arriveeUIC +
      "&datetime=" +
      moment().toISOString() + // moment().toISOString() +
      // "2018-12-11T06:40:12.024Z" +
      "&count=100";

    console.log("\r\nURL : " + url);

    if (this.config.debugging) console.log("\r\nURL loaded for SNCF: " + url);
    var self = this;
    var retry = false;

    // calling this API
    var request = unirest.get(url);

    request.headers({
      Authorization: this.config.apiKey,
    });

    // from the documentation of the api, it'll be mandatory in next version of the api
    //request.headers({'Accept': 'application/vnd.sncf.transilien.od.depart+xml;vers=1.0'});
    request.end(function(r) {
      if (r.error) {
        console.log(self.name + " : " + r.error);
        console.log(r.body); // affiche le corps de l'erreur
        retry = true;
      } else {
        self.processTransports(r.body);
      }

      if (retry) {
        console.log("retrying");
        self.scheduleUpdate(self.loaded ? -1 : this.config.retryDelay);
      }
    });
  },

  /* processTransports(data)
   * Uses the received data to set the various values.
   */
  processTransports: function(data) {
    this.transports = [];

    moment.locale(this.config.language);

    // we don't want to return too much trains
    ((data || []).journeys || [])
      .filter(nextTrain => !!nextTrain)
      .forEach(nextTrain => {
        (nextTrain.sections || [])
          .filter(
            section =>
              section.mode !== "walking" && section.transfer_type !== "walking",
          )
          .forEach(section => {
            const sectionDate = String(section.departure_date_time);
            const sectionDateTheorique = String(
              section.base_departure_date_time,
            );

            const date = sectionDate.substring(
              sectionDate.lastIndexOf(" ") + 1,
            );
            const dateTheorique = sectionDateTheorique.substring(
              sectionDate.lastIndexOf(" ") + 1,
            );

            const delay =
              section.base_departure_date_time && section.departure_date_time
                ? moment(date).diff(moment(dateTheorique), "minutes")
                : false;

            this.transports.push({
              name: section.display_informations
                ? section.display_informations.headsign
                : "No name",
              date: moment(date).format("llll") || date,
              dateTheorique: dateTheorique
                ? moment(dateTheorique).format("llll")
                : "?",
              duration: section.duration ? section.duration / 60 : "?",
              delay: delay ? delay : "",
              state: nextTrain.status,
            });
          });
      });

    this.loaded = true;
    this.sendSocketNotification("TRAINS", {
      transports: this.transports.slice(0, this.config.trainsdisplayed),
    });
  },

  /* scheduleUpdate()
   * Schedule next update.
   * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
   */
  scheduleUpdate: function(delay) {
    var nextLoad = this.config.updateInterval;

    if (typeof delay !== "undefined" && delay > 0) {
      nextLoad = delay;
    }

    var self = this;
    clearTimeout(this.updateTimer);

    self.updateTimetable();

    this.updateTimer = setInterval(function() {
      self.updateTimetable();
    }, nextLoad);
  },

  socketNotificationReceived: function(notification, payload) {
    if (payload.debugging) {
      console.log("Notif received: " + notification);
      console.log(payload);
    }

    const self = this;
    if (notification === "CONFIG" && this.started == false) {
      this.config = payload;
      this.started = true;
      self.scheduleUpdate(this.config.initialLoadDelay);
    }
  },
});
