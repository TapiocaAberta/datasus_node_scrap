var module = require('../crawler/download'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    should = require('should');
var baseUrl = 'http://cnes.datasus.gov.br/';
describe('#init', function() {
    this.timeout(5000);
    it('should download the base page.', function(done) {
        return module.doGet(baseUrl).then(function(result) {
            console.log(result);
            result.should.be.ok;
            done();
        }).catch(function(error) {
            console.log(error);
            done();
        });
    });
});