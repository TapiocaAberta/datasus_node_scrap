var fs = require('fs');

// db.states.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.cities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )

// Retrieve
var database;

exports.initialize_db = function(callback) {
      var MongoClient = require('mongodb').MongoClient;
            
      MongoClient.connect("mongodb://localhost:27017/cnes", function (err, db) {
            if (err) {
                  return console.dir(err);
            }

            database = db

            callback();
      });      
}

function save_to_db(json, collection_name) {
      // Connect to the db
      var collection = database.collection(collection_name);
      collection.insert(json, function (err, inserted) {
            if (err) {
                  console.log(err);
            } else {
                  console.log("salvo com sucesso!")
            }
      });
}

exports.save_entity = function (entity) {
      var collection_name = 'entities'
      save_to_db(entity, collection_name);
}

exports.save_states = function (states) {
      var collection_name = 'states'
      save_to_db(states, collection_name);
}

exports.save_cities = function (cities) {
      var collection_name = 'cities'
      save_to_db(cities, collection_name);
}

exports.save_entity_url = function (url) {
      var collection_name = 'entity_url';
      save_to_db(url, collection_name)
}

exports.delete_from_db = function (json, collection_name) {
      // Retrieve
      var MongoClient = require('mongodb').MongoClient;

      // Connect to the db
      MongoClient.connect("mongodb://localhost:27017/cnes", function (err, db) {
            if (err) {
                  return console.dir(err);
            }

            var collection = db.collection(collection_name);

            collection.delete(json, function (error, inserted) {
                  if (error) {
                        console.log(error);
                  }
            });
      });
}

exports.queryByObject = function (json, collection_name, callback) {
      // Retrieve
      var MongoClient = require('mongodb').MongoClient;

      // Connect to the db
      MongoClient.connect("mongodb://localhost:27017/cnes", function (err, db) {
            if (err) {
                  return console.dir(err);
            }

            var collection = db.collection(collection_name);
            var result_json = collection.find(json);

            callback(result_json);
      });
}

function get_all_entities(callback) {
      // Retrieve
      var MongoClient = require('mongodb').MongoClient;

      // Connect to the db
      MongoClient.connect("mongodb://localhost:27017/cnes", function (err, db) {
            if (err) {
                  return console.dir(err);
            }

            var collection = db.collection(collection_name);
            var all_entities = collection.find();

            callback(all_entities);
      });
}

exports.export_to_json_file = function (json) {
      fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
            console.log('File successfully written! - Check your project directory for the output.json file');
      });
}