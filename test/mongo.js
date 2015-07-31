var module = require('../crawler/db'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    should = require('should'),
    utils = require('./utils'),
    models = module.models,
    globalResult;
describe('mongoose operations', function() {
    it('should save an entity', function(done) {
        var entityJson = utils.getEntityObj();
        module.save(entityJson, models.Entity).then(function(result) {
            should(result._id).exist;
            globalResult = result;
            done();
        }).catch(function(error) {
            done(error);
        });
    });
    it('should find an entity', function(done) {
        should(globalResult).exist;
        var searchJson = {
            _id: globalResult._id
        };
        globalResult = null;
        module.findOne(searchJson, models.Entity).then(function(findResult) {
            globalResult = findResult;
            should(globalResult).exist;
            done();
        }).catch(function(error) {
            done(error);
        });
    });
    it('should delete the test object', function(done) {
        var toDelete = {
            _id: globalResult._id
        };
        globalResult = null;
        module.delete(toDelete, models.Entity).then(function() {
            done();
        }).catch(function(error) {
            done(error);
        });
    });
});
