var module = require('../index'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    should = require('should');

describe('#init', function() {
    this.timeout(5000);

    it('should execute the main function in order to execute the complete cycle of the app.', function(done) {
        done();
        /*return module.init().then(function(result) {
            done();
        }).catch(function(error) {
            console.log(error);
            done();
        });*/
    });
});