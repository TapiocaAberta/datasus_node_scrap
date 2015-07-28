var mongoose = require('./mongoose'),
    Q = require('q'),
    colors = require('colors'),
    http = require('http'),
    parser = require('./parser.js'),
    jsdom = require('jsdom'),
    jquery = require('jquery'),
    iconv = require('iconv-lite');

var baseUrl = 'http://cnes.datasus.gov.br/';

var doGet = function(url) {
    var deferred = Q.defer();

    http.get(url, function(res) {
        var data = '';
        res.setEncoding('binary');

        res.on('data', function(chunk) {
            return data += chunk;
        });

        res.on('end', function() {
            var utf8String = iconv.decode(new Buffer(data), "UTF-8");
            jsdom.env(utf8String, function(errors, htmlDoc) {
                var $ = jquery(htmlDoc);
                deferred.resolve($, url);
            });
        });

        res.on('error', function(err) {
            deferred.reject(err);
        });
    });

    return deferred.promise;
};

function downloadAndParse(parserFunction, url) {
    var deferred = Q.defer();

    doGet(url)
        .then(function(html) {
            var result = parserFunction(html, url);
            deferred.resolve(result);
        }).catch(function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
}


function processStates(baseUrl) {
    console.log('Baixando estados: ', baseUrl);

    downloadAndParse(parser.parseStates, baseUrl)
        .then(function(states) {
            Mongo.save_states(states);
            for (var i = 0; i < states.length; i++) {
                console.log(i, ' de ', states.length);
                downloadCities(states[i].url);
            }
        })
        .catch(function(err) {
            console.log(err);
        });
}

function processCities(stateUrl) {
    console.log('Baixando Cidades: ', stateUrl);

    downloadAndParse(parser.parseCities, stateUrl)
        .then(function(cities) {
            Mongo.save_cities(cities);
            for (var i = 0; i < cities.length; i++) {
                downloadEntitiesUrls(cities[i].url);
            }
        })
        .catch(function(err) {
            console.log(err);
        });
}

function processEntitiesUrls(cityUrl, callbackOnSuccess) {
    console.log('Baixando Entidades da cidade: ', cityUrl);

    downloadAndParse(parser.getEntitiesUrlsFromCity, cityUrl)
        .then(function(entitiesUrls) {
            console.log('preparando para salvar! ', entitiesUrls.length);
            Mongo.save(entitiesUrls, models.EntityUrl);
            callbackOnSuccess();
        })
        .catch(function(err) {
            console.log(err);
        });
}

function downloadEntity(entityUrl, callbackOnSuccess) {

    downloadAndParse(parser.parseCities, url)
        .then(function(result) {


        })
        .catch(function(err) {
            console.log(err);
        });


    doGet(entityUrl, function(htmlDocument, url) {
        var entity = parseEntityData(htmlDocument, url);
        entity = removeSpacesAndTabsFromString(entity);
        Mongo.save_entity(entity);
        entity = null;
        callbackOnSuccess();
    });
}

function initializeUrls() {
    var cities = Mongo.getAllCities(function(citiesCursor) {
        var processItem = function(item, done) {
            var downloadReference;
            var onFinish = function() {
                item.done = 'true';
                Mongo.update_city(item);
                processItem = null;
                downloadReference = null;
                global.gc();
                done();
            };
            downloadReference = downloadEntitiesUrls(item.url, onFinish);
        };
        mongoProcessing(citiesCursor, processItem, 10, function(err) {
            if (err) {
                console.error('on noes, an error', err);
                process.exit(1);
            }
        });
    });
}

var self = {
    doGet: doGet,
    downloadAndParse: downloadAndParse
};

module.exports = self;