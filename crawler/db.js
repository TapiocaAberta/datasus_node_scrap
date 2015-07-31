// db.states.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url_not_downloaded.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.cities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
var mongoose = require('mongoose'),
    models = require('./models'),
    utils = require('./utils'),
    Q = require('q'),
    colors = require('colors');

mongoose.connect('mongodb://localhost/cnes2015');

var self = {
    models: models,
    save: function(entities, ModelObject) {
        var deferred = Q.defer();
        var isSaved = false;
        if (Object.prototype.toString.call(entities) === '[object Array]') {
            for (var i = entities.length - 1; i >= 0; i--) {
                var ent = utils.flatten(entities[i]);
                var modelObj = new ModelObject(ent);
                modelObj.save(function(error, result) {
                    if (error) {
                        console.log(error);
                    }
                    deferred.resolve(true);
                });
            }
        } else {
            var modelObj = new ModelObject(utils.flatten(entities));
            modelObj.save(function(error, result) {
                if (error) {
                    deferred.reject(error);
                }
                deferred.resolve(result);
            });
        }
        return deferred.promise;
    },
    delete: function(json, ModelObject) {
        var deferred = Q.defer();
        ModelObject.remove(json, function(error) {
            if (error) {
                deferred.reject(error);
            }
            deferred.resolve(true);
        });
        return deferred.promise;
    },
    findOne: function(json, ModelObject) {
        var deferred = Q.defer();
        var inputJson = json || {};
        ModelObject.findOne(inputJson, function(error, result) {
            if (error) {
                deferred.reject(error);
            }
            deferred.resolve(result);
        });
        return deferred.promise;
    },
    find: function(ModelObject) {
        var stream = ModelObject.find({}).stream();
        return stream;
    },
    count: function(ModelObject, callback) {
        ModelObject.count({}, function(err, count) {
            callback(count);
        });
    },
    /*
        Return a Stream in order to make it iterable and reducing memory consumption.

        @param ModelObject - The model that will be searched on database.
        @param processFunction - the function that will receive the database document, the function should
            receive as a second parameter the `done` function that has to be called at the end. In case
            of exceptions you must have to pass it into the `done` function.

    */
    paginateDatabaseAsStream: function(ModelObject, processFunction) {
        self.count(ModelObject, function(total) {
            var stream = self.find(ModelObject);
            var count = 0;

            stream.on('data', function(doc) {
                stream.pause();
                var message = count + ' of ' + total;
                console.log(message.green);
                try {
                    processFunction(doc, function(err) {
                        if (err)
                            console.log(err);
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
    }
};

module.exports = self;
