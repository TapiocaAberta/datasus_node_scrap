var mongoProcessing = require('mongo-cursor-processing')
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
                        //console.log(err);
                  } else {
                        console.log("salvo com sucesso!")
                        json = null;
                  }

                  collection = null;
                  global.gc();
            });
      }
}

exports.update_city = function (city) {
      var collection_name = 'cities'

      if(city)
      {
            // Connect to the db
            var collection = database.collection(collection_name);
            collection.update({_id: city._id}, {$set: {done:"true"}}, function (err, inserted) {
                  if (err) {
                        console.log(err);
                  } else {
                        city = null;
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
      collection.find({done : "false"}).sort({"$natural": -1}, function(err, result_cursor) {
            callback(result_cursor);
            
            result_cursor = null
            collection = null
            global.gc();
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
      var collection = database.collection('entity_url_not_downloaded');

      collection.find({}, function(err, result_cursor) {
            callback(result_cursor);
            
            result_cursor = null
            collection = null
            global.gc();
      });
}


exports.delete_downloaded_urls = function(callback) {
      var entities_collection = database.collection("entities");
      var entity_url_collection = database.collection("entity_url");
      var not_downloaded_url_collection = database.collection("entity_url_not_downloaded");

      //entity_url_collection.copyTo("entity_url_not_downloaded"); // clone the collection
                        
      entities_collection.find({}, { "url" : 1, "_id" : 0 }).sort({"$natural": -1}, function(error, result_cursor){
            result_cursor.toArray(function(err, all_downloaded_urls) {
                  console.log("qtd: ", all_downloaded_urls.length)

                  for (var i = 0; i < all_downloaded_urls.length; i++) {
                        not_downloaded_url_collection.findAndRemove(all_downloaded_urls[i], function(err, result_document) {
                              if(err) {
                                    return console.log(err);
                              }

                              return console.log(err, result_document);
                        });
                  };
            });
            
            //callback();
      });
}

exports.remove_downloaded_url = function(url) {
      var url_collection = database.collection("entity_url_not_downloaded");      
      
      return url_collection.remove({url: url}, function(err, result_document) {
            if(err) {
                  return console.log(err);
            }

            return;
      });
}

exports.export_to_json_file = function (json) {
      fs.writeFile('output.json', JSON.stringify(json, null, 4), function (err) {
            console.log('File successfully written! - Check your project directory for the output.json file');
      });
}

exports.exportToCSV = function() {
      var processItem = function(entity_doc, done){
            appendTextToCsv(convertToCSV([entity_doc]), entity_doc, done)
      }

      var entities_collection = database.collection('entities');

      entities_collection.find({}, function(err, result_cursor) {
            mongoProcessing(result_cursor, processItem, 1, function (err) {
                  if (err) {
                        console.error('on noes, an error', err)
                        process.exit(1)
                  }
            })
      });

}

function convertToCSV(objArray) {
      var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
      var str = '';

      for (var i = 0; i < array.length; i++) {
          var line = '';
          str += '\r\n';

          for (var index in array[i]) {
              if (line != '') line += ','

              line += array[i][index];
          }

          str += line;
      }

      return str;
}

function appendTextToCsv(text, entity_doc, done) {
      if(entity_doc.UF)
      {
            var csv_path = 'output/' + entity_doc.UF + '.csv';

            fs.exists(csv_path, function (exists) {
                  if(!exists) 
                  {
                        createColumnNames(csv_path, entity_doc, function(){
                              appendText(csv_path, text, done)
                        });
                  } 
                  else 
                  {
                        appendText(csv_path, text, done)
                  }
            });
      } 
      else 
      {
            done();
      }
}


var appendText = function(csv_path, text, done)
{
      fs.appendFile(csv_path, text, function (err) {
            if(err) {
                  console.log(err)
            }

            console.log(csv_path)

            done();
      });            
}

function createColumnNames(csvPath, entity_doc, callback) {
      var entity_keys = Object.keys(entity_doc)
      var text = entity_keys
      return appendText(csvPath, text, callback);
}

