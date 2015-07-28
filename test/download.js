var module = require('../crawler/download'),
    parser = require('../crawler/parser'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    should = require('should');

var baseUrl = 'http://cnes.datasus.gov.br/';

describe('#init', function() {
    this.timeout(5000);

    it('should download the base page.', function(done) {
        return module.doGet(baseUrl).then(function(result) {
            result.should.be.ok;
            done();
        }).catch(function(error) {
            done(error);
        });
    });

    it('should download the states.', function(done) {
        var statesUrl = baseUrl + 'Lista_Tot_Es_Estado.asp';

        module.downloadAndParse(parser.parseStates, statesUrl)
            .then(function(states) {
                states.should.be.ok;
                states.should.be.an.array;
                states.should.not.be.empty();
                done();
            })
            .catch(function(err) {
                done(err);
            });
    });
});
