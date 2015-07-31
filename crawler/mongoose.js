// db.states.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url_not_downloaded.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.cities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
var mongoose = require('mongoose'),
    Q = require('q'),
    colors = require('colors');
mongoose.connect('mongodb://localhost/cnes2015');
var models = require('./models');
module.exports = {
    models: models,
    save: function(entities, ModelObject) {
        var deferred = Q.defer();
        var isSaved = false;
        if (Object.prototype.toString.call(entities) === '[object Array]') {
            for (var i = entities.length - 1; i >= 0; i--) {
                var ent = JSON.flatten(entities[i]);
                var modelObj = new ModelObject(ent);
                modelObj.save(function(error, result) {
                    if (error) {
                        console.log(error);
                    }
                    deferred.resolve(true);
                });
            }
        } else {
            var modelObj = new ModelObject(JSON.flatten(entities));
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
    }
};
JSON.flatten = function(data) {
    var result = {};

    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (var i = 0, l = cur.length; i < l; i++)
                recurse(cur[i], prop + '[' + i + ']');
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + '.' + p : p);
            }
            if (isEmpty && prop) {
                var splitProp = prop.split('.').pop();
                //result[split_prop] = {};
                result[prop] = {};
            }
        }
    }
    recurse(data, '');
    return result;
};