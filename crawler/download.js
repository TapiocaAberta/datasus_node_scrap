var mongoose = require('./mongoose'),
    Q = require('q'),
    colors = require('colors'),
    http = require('http');
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
            iconv = require('iconv-lite');
            var utf8String = iconv.decode(new Buffer(data), 'UTF-8');
            deferred.resolve(utf8String);
        });
        res.on('error', function(err) {
            deferred.reject(err);
        });
    });
    return deferred.promise;
};
// Parsear todos os estados pegando os ids
function getBaseUrl() {
    var statesUrl = baseUrl + 'Lista_Tot_Es_Estado.asp';
    return statesUrl;
}

function getPlainHtml(url, callback) {
    var params = {
        uri: url,
        method: 'GET',
        encoding: 'binary',
        gzip: true
    };
    var onResponse = function(error, response, html) {
        if (!error) {
            var env = require('jsdom').env;
            iconv = require('iconv-lite');
            var utf8String = iconv.decode(new Buffer(html), 'UTF-8');
            env(utf8String, function(errors, windowDoc) {
                var $ = require('jquery')(windowDoc);
                callback($, url);
                $ = null;
                windowDoc = null;
            });
            error = null;
            response = null;
            html = null;
            utf8String = null;
            onResponse = null;
            global.gc();
        } else {
            console.log(error);
        }
    };
    var replay = require('request-replay');
    replay(request(params, onResponse));
}

function downloadStates(baseUrl) {
    console.log('Baixando estados: ', baseUrl);
    getPlainHtml(baseUrl, function(htmlDocument, url) {
        console.log('recebido os estados!!');
        var states = parseStates(htmlDocument, url);
        Mongo.save_states(states);
        for (var i = 0; i < states.length; i++) {
            console.log(i, ' de ', states.length);
            downloadCities(states[i].url);
        }
        states = null;
    });
}

function downloadCities(stateUrl) {
    console.log('Baixando Cidades: ', stateUrl);
    getPlainHtml(stateUrl, function(htmlDocument, url) {
        var cities = parseCities(htmlDocument, url);
        Mongo.save_cities(cities);
        for (var i = 0; i < cities.length; i++) {
            downloadEntitiesUrls(cities[i].url);
        }
        cities = null;
    });
}

function downloadEntitiesUrls(cityUrl, callbackOnSuccess) {
    console.log('Baixando Entidades da cidade: ', cityUrl);
    getPlainHtml(cityUrl, function(htmlDocument, url) {
        var entitiesUrls = getEntitiesUrlsFromCity(htmlDocument);
        console.log('preparando para salvar! ', entitiesUrls.length);
        Mongo.save_entity_url(entitiesUrls);
        entitiesUrls = null;
        callbackOnSuccess();
    });
}

function downloadEntity(entityUrl, callbackOnSuccess) {
    getPlainHtml(entityUrl, function(htmlDocument, url) {
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
    doGet: doGet
};
module.exports = self;