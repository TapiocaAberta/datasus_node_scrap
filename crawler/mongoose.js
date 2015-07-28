// db.states.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entity_url_not_downloaded.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.cities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
// db.entities.ensureIndex( { "url": 1 }, { unique: true , dropDups: true} )
var mongoose = require('mongoose'),
    Q = require('q'),
    colors = require('colors');
mongoose.connect('mongodb://localhost/cnes2015');
var City = mongoose.model('City', {
    'Estado': String,
    'NomeEstado': String,
    'cidade_IBGE': String,
    'cidade_cadastrados': String,
    'cidade_nome': String,
    'done': String,
    'url': String
});
var Entity = mongoose.model('Entity', {
    'Nome': String,
    'CNES': String,
    'CNPJ': String,
    'Nome Empresarial': String,
    'CPF': String,
    'Personalidade': String,
    'Logradouro': String,
    'N\xFAmero': String,
    'Telefone': String,
    'Complemento': String,
    'Bairro': String,
    'CEP': String,
    'Munic\xEDpio': String,
    'UF': String,
    'Tipo Estabelecimento': String,
    'Sub Tipo Estabelecimento': String,
    'Esfera Administrativa': String,
    'Gest\xE3o': String,
    'Natureza da Organiza\xE7\xE3o': String,
    'Depend\xEAncia': String,
    'N\xFAmero Alvar\xE1': String,
    '\xD3rg\xE3o Expedidor': String,
    'Data Expedi\xE7\xE3o': String,
    'url': String,
    'VCo_Unidade': String,
    'VEstado': String,
    'VCodMunicipio': String
});
var EntityUrl = mongoose.model('EntityUrl', {
    'url': String,
    'VCo_Unidade': String,
    'VEstado': String,
    'VCodMunicipio': String
});
var EntityToDownload = mongoose.model('EntityToDownload', {
    'url': String,
    'VCo_Unidade': String,
    'VEstado': String,
    'VCodMunicipio': String
});
var State = mongoose.model('State', {
    'estado_nome': String,
    'estado_total': String,
    'estado_%': String,
    'url': String
});
module.exports = {
    save: function(entities) {
        var deferred = Q.defer();
        var isSaved = false;
        if (Object.prototype.toString.call(entities) === '[object Array]') {
            for (var i = entities.length - 1; i >= 0; i--) {
                var ent = JSON.flatten(entities[i]);
                var entityObj = new Entity(ent);
                entityObj.save(function(error, result) {
                    if (error) {
                        console.log(error);
                    }
                    deferred.resolve();
                });
            }
        } else {
            var entityObj = new Entity(JSON.flatten(entities));
            entityObj.save(function(error, result) {
                if (error) {
                    deferred.reject(error);
                }
                deferred.resolve(result);
            });
        }
        return deferred.promise;
    },
    delete: function(json) {
        var deferred = Q.defer();
        Entity.remove(json, function(error) {
            if (error) {
                deferred.reject(error);
            }
            deferred.resolve(true);
        });
        return deferred.promise;
    },
    findOne: function(json) {
        var deferred = Q.defer();
        var inputJson = json || {};
        Entity.findOne(inputJson, function(error, result) {
            if (error) {
                deferred.reject(error);
            }
            deferred.resolve(result);
        });
        return deferred.promise;
    },
    find: function() {
        var stream = Entity.find({}).stream();
        return stream;
    },
    count: function(callback) {
        Entity.count({}, function(err, count) {
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