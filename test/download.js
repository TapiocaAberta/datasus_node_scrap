var module = require('../crawler/download'),
    parser = require('../crawler/parser'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    should = require('should');

var baseUrl = 'http://cnes.datasus.gov.br/';
var statesUrl = baseUrl + 'Lista_Tot_Es_Estado.asp';

describe('#init', function() {
    this.timeout(5000);

    var states, cities, entitiesUrls, entity;

    it('should download the base page.', function(done) {
        return module.doGet(baseUrl).then(function(result) {
            result.should.be.ok;
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    it('should download the states.', function(done) {

        module.downloadAndParse(parser.parseStates, statesUrl)
            .then(function(states) {
                states.should.be.ok;
                states.should.be.an.array;
                states.should.not.be.empty();

                states = states;
                done();
            })
            .catch(function(error) {
                console.log(error);
                done(error)
            });
    });

    it('Should download the states', function(done) {
        module.downloadStates(statesUrl)
            .then(function(resultStates) {
                var statesLength = resultStates.length;
                states = resultStates;
                done();
            })
            .catch(function(error) {
                console.log(error);
                done(error)
            });
    });

    it('Should download the cities', function(done) {
        module.downloadCities(states[0].url)
            .then(function(resultCities) {
                cities = resultCities;
                done();
            })
            .catch(function(error) {
                console.log(error);
                done(error)
            });
    });

    it('Should download the Entities Urls', function(done) {
        module.downloadEntitiesUrls(cities[0].url)
            .then(function(urls) {
                entitiesUrls = urls;
                done();
            })
            .catch(function(error) {
                console.log(error);
                done(error)
            });
    });


    /*it('Should download the entity', function(done) {
        parser.parseEntityData
            .then(function(entity) {
                entity.should.be.ok
            })
            .catch(function(error) {
                console.log(error);
                done(error)
            });
    });*/


});
