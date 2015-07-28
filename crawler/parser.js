var mongoose = require('./mongoose'),
    Q = require('q'),
    colors = require('colors');

function parseStates(htmlDocument, url) {
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
        var params = getQueryStrings(url);
        if (params)
            stateJson = mergeJson(stateJson, params);
        stateJson = removeSpacesAndTabsFromString(stateJson);
        states.push(stateJson);
    }
    htmlDocument = null;
    table = null;
    trs = null;
    return states;
}

function parseCities(htmlDocument, url) {
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
        var params = getQueryStrings(url);
        cityJson = mergeJson(cityJson, params);
        cityJson = removeSpacesAndTabsFromString(cityJson);
        cities.push(cityJson);
    }
    htmlDocument = null;
    table = null;
    trs = null;
    return cities;
}

function getEntitiesUrlsFromCity(htmlDocument) {
    entities = [];
    var div = htmlDocument.find('div[style=\'width:539; height:500; POSITION: absolute; TOP:198px; LEFT: 121px; overflow:auto\']');
    var table = htmlDocument(div).find('table');
    var links = htmlDocument(div).find('a');
    for (var i = links.length - 1; i >= 0; i--) {
        var entityUrlObject = {
            'url': baseUrl + links[i].getAttribute('href')
        };
        var params = getQueryStrings(baseUrl + links[i].getAttribute('href'));
        entityUrlObject = mergeJson(entityUrlObject, params);
        entities.push(entityUrlObject);
    }
    htmlDocument = null;
    div = null;
    table = null;
    links = null;
    return entities;
}

function parseEntityData(htmlDocument, url) {
    var json = {};
    var tableEntity = htmlDocument.find('table[bgcolor= \'white\']');
    // the table that has the properties is the only that the bg is 'white'
    var rows = htmlDocument(tableEntity).find('tr');
    for (var trIndex = 0; trIndex < rows.length; trIndex += 2) {
        var tdKeys = htmlDocument(rows[tr_index]).find('td');
        var values = htmlDocument(rows[trIndex + 1]).find('td');
        for (var tdIndex = 0; tdIndex < tdKeys.length; tdIndex++) {
            var key = tdKeys[td_index].textContent.replace(':', '');
            var value = values[td_index].textContent;
            json[key] = value;
        }
    }
    var params = getQueryStrings(url);
    json.url = url;
    json = mergeJson(json, params);
    json = removeSpacesAndTabsFromString(json);
    htmlDocument = null;
    tableEntity = null;
    rows = null;
    params = null;
    return json;
}

function mergeJson(json1, json2) {
    var json2_keys = Object.keys(json2);
    // TODO: how to get keys in a javascript object?
    for (var i = 0; i < json2_keys.length; i++) {
        var key = json2_keys[i];
        var value = json2[json2_keys[i]];
        json1[key] = value;
    }
    json2 = null;
    return json1;
}

function mergeEntityWithCities(state, city, entity) {
    baseJson = mergeJson(state, city);
    entityJson = parseEntityData(entity);
    json = mergeJson(baseJson, entityJson);
    json = removeSpacesAndTabsFromString(json);
    baseJson = null;
    entityJson = null;
    Mongo.save_to_db(json);
    json = null;
}

function removeSpacesAndTabsFromString(json) {
    var jsonKeys = Object.keys(json);
    for (key in jsonKeys) {
        json[jsonKeys[key]] = json[jsonKeys[key]].replace(/^\s+|\s+$/g, '');
    }
    jsonKeys = null;
    return json;
}

function getQueryStrings(url) {
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
var self = {};
module.exports = self;