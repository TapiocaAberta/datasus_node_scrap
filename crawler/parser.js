var mongoose = require('./mongoose'),
    Q = require('q'),
    colors = require('colors');
var baseUrl = 'http://cnes.datasus.gov.br/';
var self = {
    parseStates: function(htmlDocument, url) {
        states = [];
        var table = htmlDocument('div[style = \'width:300; height:209; POSITION: absolute; TOP: 185px; LEFT: 400px; overflow:auto\'] table');
        var trs = htmlDocument(table).find('tr');
        for (var i = trs.length - 1; i >= 0; i--) {
            var tds = htmlDocument(trs[i]).find('td');
            var stateJson = {};
            stateJson.estado_nome = htmlDocument(tds[0]).text();
            stateJson.estado_total = htmlDocument(tds[1]).text();
            stateJson['estado_%'] = htmlDocument(tds[2]).text();
            stateJson.url = baseUrl + htmlDocument(tds[0]).find('a').attr('href');
            var params = self.getQueryStrings(url);
            if (params)
                stateJson = self.mergeJson(stateJson, params);
            stateJson = self.removeSpacesAndTabsFromString(stateJson);
            states.push(stateJson);
        }
        return states;
    },
    parseCities: function(htmlDocument, url) {
        var cities = [];
        var table = htmlDocument('div[style = \'width:450; height:300; POSITION: absolute; TOP: 201px; LEFT: 180px; overflow:auto\'] table');
        var trs = htmlDocument(table).find('tr');
        for (var i = trs.length - 1; i >= 0; i--) {
            var tds = htmlDocument(trs[i]).find('td');
            var cityJson = {};
            cityJson.cidade_IBGE = htmlDocument(tds[0]).text();
            cityJson.cidade_nome = htmlDocument(tds[1]).text();
            cityJson.cidade_cadastrados = htmlDocument(tds[2]).text();
            cityJson.url = baseUrl + htmlDocument(tds[1]).find('a').attr('href');
            var params = self.getQueryStrings(url);
            cityJson = self.mergeJson(cityJson, params);
            cityJson = self.removeSpacesAndTabsFromString(cityJson);
            cities.push(cityJson);
        }
        htmlDocument = null;
        table = null;
        trs = null;
        return cities;
    },
    getEntitiesUrlsFromCity: function(htmlDocument) {
        entities = [];
        var div = htmlDocument.find('div[style=\'width:539; height:500; POSITION: absolute; TOP:198px; LEFT: 121px; overflow:auto\']');
        var table = htmlDocument(div).find('table');
        var links = htmlDocument(div).find('a');
        for (var i = links.length - 1; i >= 0; i--) {
            var entityUrlObject = {
                'url': baseUrl + links[i].getAttribute('href')
            };
            var params = self.getQueryStrings(baseUrl + links[i].getAttribute('href'));
            entityUrlObject = self.mergeJson(entityUrlObject, params);
            entities.push(entityUrlObject);
        }
        htmlDocument = null;
        div = null;
        table = null;
        links = null;
        return entities;
    },
    parseEntityData: function(htmlDocument, url) {
        var json = {};
        var trIndex, tdIndex;
        var tableEntity = htmlDocument.find('table[bgcolor= \'white\']');
        // the table that has the properties is the only that the bg is 'white'
        var rows = htmlDocument(tableEntity).find('tr');
        for (trIndex = 0; trIndex < rows.length; trIndex += 2) {
            var tdKeys = htmlDocument(rows[trIndex]).find('td');
            var values = htmlDocument(rows[trIndex + 1]).find('td');
            for (tdIndex = 0; tdIndex < tdKeys.length; tdIndex++) {
                var key = tdKeys[tdIndex].textContent.replace(':', '');
                var value = values[tdIndex].textContent;
                json[key] = value;
            }
        }
        var params = self.getQueryStrings(url);
        json.url = url;
        json = self.mergeJson(json, params);
        json = self.removeSpacesAndTabsFromString(json);
        return json;
    },
    mergeJson: function(json1, json2) {
        var json2_keys = Object.keys(json2);
        // TODO: how to get keys in a javascript object?
        for (var i = 0; i < json2_keys.length; i++) {
            var key = json2_keys[i];
            var value = json2[json2_keys[i]];
            json1[key] = value;
        }
        json2 = null;
        return json1;
    },
    mergeEntityWithCities: function(state, city, entity) {
        baseJson = self.mergeJson(state, city);
        entityJson = self.parseEntityData(entity);
        json = self.mergeJson(baseJson, entityJson);
        json = self.removeSpacesAndTabsFromString(json);
        baseJson = null;
        entityJson = null;
        Mongo.save_to_db(json);
        json = null;
    },
    removeSpacesAndTabsFromString: function(json) {
        var jsonKeys = Object.keys(json);
        for (key in jsonKeys) {
            json[jsonKeys[key]] = json[jsonKeys[key]].replace(/^\s+|\s+$/g, '');
        }
        jsonKeys = null;
        return json;
    },
    getQueryStrings: function(url) {
        var result;
        var urlParams = url.indexOf('?') + 1;
        if (urlParams) {
            var qs = url.substring(urlParams).split('&');
            if (qs) {
                for (var i = 0, result = {}; i < qs.length; i++) {
                    qs[i] = qs[i].split('=');
                    result[qs[i][0]] = decodeURIComponent(qs[i][1]);
                }
            }
        }
        return result;
    }
};
module.exports = self;