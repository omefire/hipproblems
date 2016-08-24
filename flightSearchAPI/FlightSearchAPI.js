

var http = require('http');
var Q = require('q');

// ToDO: Do not hardcode these values
// ... Maybe, retrieve them from a DB table or a config file or something
const PROVIDERS = ['Expedia', 'Orbitz', 'Priceline', 'Travelocity', 'United'];

// Task List: 
// - Query all providers and return a merged result:
//      * search all providers (done)
//      * sort results by agony (done)
//      * merge sorted results (done)
//      * results returned by the scraper API are already sorted by agony
//      * expose new API via one endpoint: GET /flights/search (done)
//      * exception handling + edge cases handling (done)

function FlightSearchAPI(server, port) {
    this.server = server;
    this.port = port;
}

FlightSearchAPI.prototype.search = function () {

    var self = this;

    // Query all providers concurrently (using Q.allSettled), because doing this serially would be too slow
    var promises = PROVIDERS.map(function (provider) {
        return queryProvider(self.server, self.port, provider);
    });

    return Q.allSettled(promises).then(function (results) {

        // If there is an error querying any provider, stop processing and error out
        results.forEach(function (res) {
            if (res.state !== "fulfilled") {
                throw new Error("There was an error querying one of the providers"); 
            }
        });

        return results.map(function (result) {
            return result.value;
        });
    }).then(function (scraperResults) {
        return scraperResults.map(function (elt) {
            return elt.results;
        }).reduce(function (sortedSoFar, toBeSorted) {
            return merge(sortedSoFar, toBeSorted);
        });
    }).fail(function(err) {
        throw new Error(err);
    });
};

// Queries a provider and returns a promise that will be 
// fulfilled with the provider's results
function queryProvider(server, port, provider) {
    var deferred = Q.defer();
    http.get({
        host: server,
        port: port,
        path: "/scrapers/" + provider
    }, function (resp) {
        resp.setEncoding();
        var searchResult = "";
        resp.on("data", function (data) {
            searchResult += data;
        });
        resp.on("end", function () {
            deferred.resolve(JSON.parse(searchResult));
        })
    }).on("error", function (e) {
        deferred.reject(e); 
    });

    return deferred.promise;
}

// Merge two sorted lists of results gotten back from providers
function merge(left, right) {
    var result = [];
    var leftIndex = 0;
    var rightIndex = 0;

    while (leftIndex < left.length && rightIndex < right.length) {
        if (left[leftIndex].agony <= right[rightIndex].agony) {
            result.push(left[leftIndex]);
            leftIndex++;
        } else {
            result.push(right[rightIndex]);
            rightIndex++;
        }
    }

    for (var i = leftIndex; i < left.length; i++) {
        result.push(left[i]);
    }

    for (var j = rightIndex; j < right.length; j++) {
        result.push(right[j]);
    }

    return result;
}

module.exports = FlightSearchAPI;