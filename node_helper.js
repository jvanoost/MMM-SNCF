/* Timetable for SNCF train Module */
/* Magic Mirror
	* Module: MMM-SNCF
	*
	* By Jerome Van Oost
	* MIT Licensed.
*/
const NodeHelper = require("node_helper");
const forge = require('node-forge');
const unirest = require('unirest');
const moment = require('moment');

function btoa(str) {
    var buffer
	;
	
    if (str instanceof Buffer) {
		buffer = str;
		} else {
		buffer = new Buffer(str.toString(), 'binary');
	}
	
    return buffer.toString('base64');
};

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
        var url = "https://api.sncf.com/v1/coverage/sncf/journeys?from="+ this.config.departUIC + "&to="+ this.config.arriveeUIC+"&datetime="+moment().toISOString() +"&count="+  this.config.trainsdisplayed;
        console.log("\r\nURL : "+url);
	    if (this.config.debugging) console.log("\r\nURL loaded for SNCF: "+url);
        var self = this;
        var retry = false;
		
        // calling this API
        var request = unirest.get(url);
		request.headers({
			'Authorization': (this.config.login),
		});
	
	// from the documentation of the api, it'll be mandatory in next version of the api
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
			self.scheduleUpdate((self.loaded) ? -1 : this.config.retryDelay);
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
	responseInJson = data.journeys;
	
	// we search if there are disruptions
	if(data.disruptions)
	{
		disruptions = data.disruptions;
	}
	else
	{
		disruptions = 0;
	}
	
	var count = this.config.trainsdisplayed;
	if(responseInJson.length < count)
	{
		count = responseInJson.length;
	}
	
	for (var i = 0; i < count; i++) {
		
		var nextTrain = responseInJson[i];
		
		if(nextTrain !== undefined)
		{
			for(var j=0; j<nextTrain.sections.length; j++){
				
		    	if(nextTrain.sections[j].mode != "walking")
		    	{
		    		var _date = '' + nextTrain.sections[j].departure_date_time;
		    		var _dateTheorique = '' + nextTrain.sections[j].base_departure_date_time;
					var _alert = nextTrain.sections[j].display_informations.links;
					
					var _disruptionMessage = '';
					
					
					_date = _date.substring(_date.lastIndexOf(" ")+1);
					_dateTheorique = _dateTheorique.substring(_date.lastIndexOf(" ")+1);
					
					var _delay = moment(_date).diff(moment(_dateTheorique),"minutes");
					
					this.transports.push({
						name: nextTrain.sections[j].display_informations.headsign,
						date: moment(_date).format('llll'),
						dateTheorique : moment(_dateTheorique).format('llll'),
						duration: nextTrain.sections[j].duration/60, // duration in minutes
						delay: _delay,
						disruptionMessage: _disruptionMessage,
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
scheduleUpdate: function(delay) {
	var nextLoad = this.config.updateInterval;
	
	if (typeof delay !== "undefined" && delay > 0) {
		nextLoad = delay;
	}
	
	var self = this;
	clearTimeout(this.updateTimer);
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
	if (notification === 'CONFIG' && this.started == false) {
		this.config = payload;
		this.started = true;
		self.scheduleUpdate(this.config.initialLoadDelay);
	}
}
});
