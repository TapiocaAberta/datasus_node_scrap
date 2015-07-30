var mongoose = require('./mongoose'),
    Q = require('q'),
    colors = require('colors'),
    http = require('http'),
    parser = require('./parser.js'),
    jsdom = require('jsdom'),
    jquery = require('jquery'),
    iconv = require('iconv-lite');

var baseUrl = 'http://cnes.datasus.gov.br/';

var self = {
    doGet: function(url) {
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
    },

    downloadAndParse: function(parserFunction, url) {
        var deferred = Q.defer();

        self.doGet(url)
            .then(function(html) {
                var result = parserFunction(html, url);
                deferred.resolve(result);
            }).catch(function(err) {
                deferred.reject(err);
            });

        return deferred.promise;
    },

    downloadStates: function(url) {
        var deferred = Q.defer();
        console.log('Baixando estados: ', url);

        self.downloadAndParse(parser.parseStates, url)
            .then(function(states) {
                deferred.resolve(states);
            })
            .catch(function(err) {
                console.log(err);
                deferred.reject(err);
            });

        return deferred.promise;
    },

    downloadCities: function(url) {
        var deferred = Q.defer();
        console.log('Baixando Cidades: ', url);

        self.downloadAndParse(parser.parseCities, url)
            .then(function(cities) {
                deferred.resolve(cities);
            })
            .catch(function(err) {
                console.log(err);
                deferred.reject(err);
            });
        return deferred.promise;
    },

    downloadEntitiesUrls: function(url) {
        var deferred = Q.defer();
        console.log('Baixando Entidades da cidade: ', url);

        self.downloadAndParse(parser.getEntitiesUrlsFromCity, url)
            .then(function(entitiesUrls) {
                deferred.resolve(entitiesUrls);
            })
            .catch(function(err) {
                console.log(err);
                deferred.reject(err);
            });
        return deferred.promise;
    },

    downloadEntity: function(url) {
        var deferred = Q.defer();
        self.downloadAndParse(parser.parseEntityData, url)
            .then(function(entity) {
                deferred.resolve(entity);
            })
            .catch(function(err) {
                console.log(err);
                deferred.reject(err);
            });

        return deferred.promise;
    },

    processStates: function() {
        self.downloadStates
            .then(function(states) {
                Mongo.save(states, models.State);
                var statesLength = states.length;

                _.forEach(states, function(state, key) {
                    console.log(key, ' de ', statesLength);
                    downloadCities(state.url)
                        .then(processCities);
                });
            });
    },

    processCities: function(cities) {
        Mongo.save(cities, models.City);

        _.forEach(cities, function(city, key) {
            self.downloadEntitiesUrls(city.url)
                .then(self.processEntities);
        });
    },

    processEntities: function(entitiesUrls) {

        //Mongo.getCursor...

        self.downloadEntity()
            .then(function(states) {
                Mongo.save(states, models.State);
                var statesLength = states.length;

                _.forEach(states, function(state, key) {
                    console.log(key, ' de ', statesLength);
                    downloadCities(state.url)
                        .then(processCities);
                });
            });
    },

    initializeUrls: function() {
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
};

module.exports = self;
