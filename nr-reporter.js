var os = require('os');
var http = require('http');

// globals

var platform_api_uri = "https://platform-api.newrelic.com/platform/v1/metrics";
var poll_cycle = 60; // time in seconds
var version = "1.0.1"; // major_version.minor_version.patch_level
var agent_host = os.hostname();
var agent_pid = process.pid;
var last_poll_time = new Date()-60000;

var agent_hash = {host: agent_host, pid: agent_pid, version: version};

var signals = {}; // not aggregated (from callback)
var stats = {}; // aggregated (from calls)

//     for each monitored_component do

component = {};
component.guid = "com.newrelic.rpi_javapod";
component.name = "Raspberry Pi in Java Agent Pod";
component.duration = 0;
component.metrics = {};


function loop () {
  console.log('sending');
  var hash_to_send = {}
  hash_to_send.agent = agent_hash;
  component.metrics = {}
  Object.keys(signals).forEach (function(each) {
    component.metrics[each] = signals[each]()
  });
  Object.keys(stats).forEach (function(each) {
    component.metrics[each] = stats[each]
  });
  component.duration = Math.floor((new Date() - last_poll_time) / 1000);
  hash_to_send.components = [component]
  
  var json_to_send = JSON.stringify(hash_to_send, null, 2);
  console.log(json_to_send);
  // connection = open http_connection(platform_api_uri)
  
  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': json_to_send.length,
    'Accept':"application/json",
    'X-License-Key': '79f64277817661e8a5115b452f02f427a31f45b5'
  };
  
  var options = {
    host: 'platform-api.newrelic.com',
    port: 80,
    path: '/platform/v1/metrics',
    method: 'POST',
    headers: headers
  };
  
  var req = http.request(options, function(res) {
    res.setEncoding('utf-8');
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    
    switch (res.statusCode) {
      case 200:
      case 204:
        component.metrics = {}
        last_poll_time = new Date();
        stats = {}
        break;
      case 400:
        // your request was malformed
        // consider reporting a "supportability" metric which counts the number of 400 responses you get
        // for example "Component/Supportability/http_error_codes/400"
        // you can use this on a "Supportability" Dashboard that helps diagnose your agent
      case 403:
        // forbidden probably due to a bad license key
        // log error and shutdown the agent
      case 404:
        // invalid URL
        // you should never get this error for https://platform-api.newrelic.com/platform/v1/metrics
      case 405:
        // invalid method
        // HTTP verb should be "POST"
      case 413:
        // POST body too large
        // try splitting at component boundaries
        // split along metric name spaces
        // fail gracefully - consider reporting a supportability metric (see 400)
      case 500:
        // error on New Relic's servers
        // could be due to malformed data or system trouble
        // fail gracefully - consider reporting a supportability metric (see 400)
      case 503:
      case 504:
        // New Relic servers busy - this happens by design from time-to-time
        // keep collecting metrics
        // do NOT reset last_poll_time
        // log error if the problem persists for several minutes
        console.log("status: ", res.statusCode, " -- see source for meaning")
        break;
      default:
        console.log("status: ", res.statusCode, " -- no explaination, sorry")
    }
    
    
    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      var resultObject = JSON.parse(responseString);
      console.log(resultObject);
    });
    
  });
  req.write(json_to_send);
  req.end();
}


setInterval(loop, 60000);
console.log('reporting');

var reporter = {
  signal: function (name, funct) {
    console.log('signal', name);
    signals[name] = funct;
  },
  stat: function (name, value) {
    var s = stats[name];
    if (!s) {
      stats[name] = {
        count: 1,
        total: value,
        min: value,
        max: value,
        sum_of_squares: value*value
      };
    } else {
      s.count += 1;
      s.total += value;
      s.min = Math.min(s.min, value);
      s.max = Math.max(s.max, value);
      s.sum_of_squares += value*value;
    } 
  }
}
module.exports = reporter;
