

var http = require('http');
var Q = require('q');

// ToDO: 
// - Query all providers and return a merged result:
//      * search all providers (done)
//      * sort results by agony (done)
//      * merge sorted results (done)
//      * results returned by the scraper API are already sorted by agony
//      * expose new API via one endpoint: GET /flights/search (done)
//      * Exception Handling + Edge cases Handling

function FlightSearchAPI(server, port, providers) {
    this.server = server;
    this.port = port;
    this.providers = providers;
}

FlightSearchAPI.prototype.search = function () {
    var self = this;

    var searchProvider = function (provider) {
        var deferred = Q.defer();
        http.get({
            host: self.server,
            port: self.port,
            path: "/scrapers/" + provider
        }, function (resp) {
            resp.setEncoding();
            var searchResult = "";
            resp.on("data", function (data) {
                searchResult += data;
            });
            resp.on("end", function () {
                var r = searchResult;
                deferred.resolve(JSON.parse(searchResult));
            })
        }).on("error", function (e) {
            deferred.reject(e); // ToDO: Test this!    
        });

        return deferred.promise;
    }

    // ToDO: better name
    var promises = this.providers.map(function (provider) {
        return searchProvider(provider);
    });

    // Send queries to the endpoint concurrently
    return Q.allSettled(promises).then(function (results) {
        // If any provider errored out, stop computing
        results.forEach(function (res) {
            if (res.state !== "fulfilled") {
                throw new Error(""); //ToDO: Test this!
            }
        });

        return results.map(function (result) {
            return result.value;
        });
    }).then(function (scraperResults) {
        // We need to sort the scraper results
        //return mergeSort(scraperResults);
        // ToDO: Test with 1 elt, 2 elts, 3 elts, multiple elts
        return scraperResults.map(function(elt) {
            return elt.results;
        }).reduce(function (sortedSoFar, toBeSorted) {
            return mergeSort(sortedSoFar, toBeSorted);
        });
    });
};

function mergeSort(left, right) {
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

    /*if(scraperResults.length <= 1) {
        return scraperResults;
    }
    var result = [];

    // Merge the first 2 arrays
    var cum = mergeSortTwoArrays(scraperResults[0], scraperResults[1]);
    return scraperResults.reduce(mergeSortTwoArrays);
    //A, B, C, D, E*/

}

module.exports = FlightSearchAPI;