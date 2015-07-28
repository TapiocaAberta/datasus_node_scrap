var mongoProcessing = require('mongo-cursor-processing');
var fs = require('fs');
// db.states.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url_not_downloaded.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.cities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// Retrieve
var database;
exports.initialize_db = function(callback) {
    var MongoClient = require('mongodb').MongoClient;
    MongoClient.connect('mongodb://localhost:27017/cnes', function(err, db) {
        if (err) {
            return console.dir(err);
        }
        database = db;
        callback();
    });
};

function saveToDb(json, collectionName) {
    if (json) {
        // Connect to the db
        var collection = database.collection(collectionName);
        collection.insert(json, function(err, inserted) {
            if (err) {} else {
                console.log('salvo com sucesso!');
                json = null;
            }
            collection = null;
            global.gc();
        });
    }
}
exports.update_city = function(city) {
    var collectionName = 'cities';
    if (city) {
        // Connect to the db
        var collection = database.collection(collectionName);
        collection.update({
            _id: city._id
        }, {
            $set: {
                done: 'true'
            }
        }, function(err, inserted) {
            if (err) {
                console.log(err);
            } else {
                city = null;
            }
            collection = null;
            global.gc();
        });
    }
};
exports.save_entity = function(entity) {
    var collectionName = 'entities';
    saveToDb(entity, collectionName);
};
exports.save_states = function(states) {
    var collectionName = 'states';
    saveToDb(states, collectionName);
};
exports.save_cities = function(cities) {
    var collectionName = 'cities';
    saveToDb(cities, collectionName);
};
exports.save_entity_url = function(url) {
    var collectionName = 'entity_url';
    saveToDb(url, collectionName);
};
exports.delete_from_db = function(json, collectionName) {
    var collection = database.collection(collectionName);
    collection.delete(json, function(error, inserted) {
        if (error) {
            console.log(error);
        }
    });
};
exports.queryByObject = function(json, collectionName, callback) {
    var collection = database.collection(collectionName);
    collection.findOne(json, function(err, resultJson) {
        callback(resultJson);
        resultJson = null;
        collection = null;
        global.gc();
    });
};
exports.getAllCities = function(callback) {
    var collection = database.collection('cities');
    collection.find({
        done: 'false'
    }).sort({
        '$natural': -1
    }, function(err, resultCursor) {
        callback(resultCursor);
        resultCursor = null;
        collection = null;
        global.gc();
    });
};
exports.isEntityAlreadyDownloaded = function(json, callback) {
    var callbackConsult = function(documentFromDb) {
        var isAlreadyDownloaded = false;
        if (documentFromDb) {
            isAlreadyDownloaded = true;
        }
        callback(documentFromDb, isAlreadyDownloaded);
    };
    if (json) {
        if (json.url) {
            var jsonToConsult = {
                'url': json.url
            };
            this.queryByObject(jsonToConsult, 'entities', callbackConsult);
        }
    }
};
exports.get_all_entities = function(callback) {
    var collection = database.collection('entity_url_not_downloaded');
    collection.find({}, function(err, resultCursor) {
        callback(resultCursor);
        resultCursor = null;
        collection = null;
        global.gc();
    });
};
exports.delete_downloaded_urls = function(callback) {
    var entitiesCollection = database.collection('entities');
    var entityUrlCollection = database.collection('entity_url');
    var notDownloadedUrlCollection = database.collection('entity_url_not_downloaded');
    //entity_url_collection.copyTo("entity_url_not_downloaded"); // clone the collection
    entitiesCollection.find({}, {
        'url': 1,
        '_id': 0
    }).sort({
        '$natural': -1
    }, function(error, resultCursor) {
        resultCursor.toArray(function(err, allDownloadedUrls) {
            console.log('qtd: ', allDownloadedUrls.length);
            for (var i = 0; i < allDownloadedUrls.length; i++) {
                notDownloadedUrlCollection.findAndRemove(allDownloadedUrls[i], function(err, resultDocument) {
                    if (err) {
                        return console.log(err);
                    }
                    return console.log(err, resultDocument);
                });
            }
        }); //callback();
    });
};
exports.remove_downloaded_url = function(url) {
    var urlCollection = database.collection('entity_url_not_downloaded');
    return urlCollection.remove({
        url: url
    }, function(err, resultDocument) {
        if (err) {
            return console.log(err);
        }
        return;
    });
};
exports.export_to_json_file = function(json) {
    fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err) {
        console.log('File successfully written! - Check your project directory for the output.json file');
    });
};
exports.exportToCSV = function() {
    var processItem = function(entityDoc, done) {
        appendTextToCsv(convertToCSV([entityDoc]), entityDoc, done);
    };
    var entitiesCollection = database.collection('entities');
    entitiesCollection.find({}, function(err, resultCursor) {
        mongoProcessing(resultCursor, processItem, 1, function(err) {
            if (err) {
                console.error('on noes, an error', err);
                process.exit(1);
            }
        });
    });
};

function convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';
    for (var i = 0; i < array.length; i++) {
        var line = '';
        str += '\r\n';
        for (var index in array[i]) {
            if (line != '')
                line += ',';
            line += array[i][index];
        }
        str += line;
    }
    return str;
}

function appendTextToCsv(text, entityDoc, done) {
    if (entityDoc.UF) {
        var csvPath = 'output/' + entityDoc.UF + '.csv';
        fs.exists(csvPath, function(exists) {
            if (!exists) {
                createColumnNames(csvPath, entityDoc, function() {
                    appendText(csvPath, text, done);
                });
            } else {
                appendText(csvPath, text, done);
            }
        });
    } else {
        done();
    }
}
var appendText = function(csvPath, text, done) {
    fs.appendFile(csvPath, text, function(err) {
        if (err) {
            console.log(err);
        }
        console.log(csvPath);
        done();
    });
};

function createColumnNames(csvPath, entityDoc, callback) {
    var entityKeys = Object.keys(entityDoc);
    var text = entityKeys;
    return appendText(csvPath, text, callback);
}