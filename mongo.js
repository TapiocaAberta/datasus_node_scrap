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
      if(json) 
      {
            // Connect to the db
            var collection = database.collection(collection_name);
            collection.insert(json, function (err, inserted) {
                  if (err) {
                        console.log(err);
                  } else {
                        console.log("salvo com sucesso!")
                        json = null;
                  }

                  collection = null;
                  global.gc();
            });
      }
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
      var collection = database.collection(collection_name);

      collection.delete(json, function (error, inserted) {
            if (error) {
                  console.log(error);
            }
      });
}

exports.queryByObject = function (json, collection_name, callback) {
      var collection = database.collection(collection_name);
      collection.findOne(json, function(err, result_json){
            callback(result_json);

            result_json = null
            collection = null
            global.gc();
      });
}

exports.getAllCities = function (callback) {
      var collection = database.collection('cities');
      collection.find({}, function(err, result_cursor){
            callback(result_cursor);
            
            //result_cursor = null
            //collection = null
            //global.gc();
      });
}

exports.isEntityAlreadyDownloaded = function(json, callback)
{
      var callbackConsult = function(documentFromDb)
      {
            var isAlreadyDownloaded = false;

            if(documentFromDb) {
                  isAlreadyDownloaded = true;            
            }

            callback(documentFromDb, isAlreadyDownloaded);
      }

      if(json) {
            if(json.url) {
                  var jsonToConsult = {
                        'url' : json.url
                  }

                  this.queryByObject(jsonToConsult, 'entities', callbackConsult);
            }            
      }
}

exports.get_all_entities = function(callback) {
      var collection = database.collection("entity_url");
      var all_entities = collection.find();

      callback(all_entities);
}

exports.export_to_json_file = function (json) {
      fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
            console.log('File successfully written! - Check your project directory for the output.json file');
      });
}