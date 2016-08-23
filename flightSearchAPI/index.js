
var http = require('http');
var dispatcher = require('httpdispatcher');
var FlightSearchAPI = require('./FlightSearchAPI');

const FLIGHT_SEARCH_PORT = 8080;

const PORT = "9000";
const SERVER = "localhost";
const PROVIDERS = ['Expedia', 'Orbitz', 'Priceline', 'Travelocity', 'United'];

dispatcher.onGet("/flights/search", function (req, res) {
    var api = new FlightSearchAPI(SERVER, PORT, PROVIDERS);
    var results = api.search();

    results.then(function(result) {
        res.writeHead(200, { 'Content-Type': 'text/json' });
        res.end(JSON.stringify(result));
    });
});

function handleRequest(request, response) {
    try {
        dispatcher.dispatch(request, response);
    } catch (err) {
        console.log("An error occurred while handling the request: " + err);
    }
}

var server = http.createServer(handleRequest);

server.listen(FLIGHT_SEARCH_PORT, function () {
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", FLIGHT_SEARCH_PORT);
});