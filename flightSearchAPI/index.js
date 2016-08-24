
var http = require('http');
var dispatcher = require('httpdispatcher');
var FlightSearchAPI = require('./FlightSearchAPI');

const FLIGHT_SEARCH_PORT = 8080;

const PORT = "9000";
const SERVER = "localhost";

dispatcher.onGet("/flights/search", function (req, res) {
    
    // Perform the search against all providers using our API
    var api = new FlightSearchAPI(SERVER, PORT);
    var searchResult = api.search();

    searchResult.then(function(result) {
        // Make sure that everything is sorted correctly
        /*for(var i = 1; i < result.length; i++) {
            if(result[i].agony < result[i-1].agony) {
                throw new Error("Not sorted correctly!");
            }
        }*/

        // Transform the array we get back into JSON and send it to the client
        res.writeHead(200, { 'Content-Type': 'text/json' });
        res.end(JSON.stringify(result));
    }).fail(function(err) {
        console.log("Error: " + err);
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