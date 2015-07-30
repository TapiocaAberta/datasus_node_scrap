var Mongo = require('./mongoose'),
    models = Mongo.models,
    Q = require('q'),
    _ = require('lodash'),
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
        var statesUrl = baseUrl + 'Lista_Tot_Es_Estado.asp';

        self.downloadStates(statesUrl)
            .then(function(states) {
                Mongo.save(states, models.State);
                var statesLength = states.length;

                self.forSync(states, function(state, done) {
                    self.downloadCities(state.url)
                        .then(function(cities) {
                            self.processCities(cities)
                            done();
                        });
                });
            });
    },

    processCities: function(cities) {
        Mongo.save(cities, models.City);

        self.forSync(cities, function(city, done) {
            self.downloadEntitiesUrls(city.url)
                .then(function(entitiesUrls) {
                    self.processEntitiesUrl(entitiesUrls)
                    done();
                });
        });
    },

    processEntitiesUrl: function(entitiesUrls) {
        Mongo.save(entitiesUrls, models.EntityToDownload);
    },

    processEntities: function() {
        self.paginateDatabaseAsStream(models.EntityToDownload, function(entityToDownload, done) {
            self.downloadEntity(entityToDownload.url)
                .then(function(entity) {
                    Mongo.save(entity, models.Entity);
                    done();
                });
        });
    },

    makeIterator: function(array) {
        var nextIndex = 0;

        return {
            next: function() {
                return nextIndex < array.length ? {
                    value: array[nextIndex++],
                    done: false
                } : {
                    done: true
                };
            }
        }
    },

    forSync: function(array, processFunction) {
        var cursor = self.makeIterator(array);

        var process = function(cursor) {
            var value = cursor.next();

            processFunction(value.value, function() {
                return process(cursor);
            });
        };

        process(cursor);
    },

    /*
        Return a Stream in order to make it iterable and reducing memory consumption.

        @param ModelObject - The model that will be searched on database.
        @param processFunction - the function that will receive the database document, the function should
            receive as a second parameter the `done` function that has to be called at the end. In case
            of exceptions you must have to pass it into the `done` function.

    */
    paginateDatabaseAsStream: function(ModelObject, processFunction) {
        Mongo.count(ModelObject, function(total) {
            var stream = Mongo.find(ModelObject);

            stream.on('data', function(doc) {
                stream.pause();

                var message = count + " of " + total;
                console.log(message.green);

                try {
                    processFunction(doc, function(err) {
                        if (err) console.log(err);
                        stream.resume();
                        count++;
                    });
                } catch (e) {
                    console.log(e);
                    stream.resume();
                    count++;
                }
            });
        });
    },

    initialize: function() {
        self.processStates();
        //self.processEntities();
    }
};

self.initialize();

module.exports = self;
