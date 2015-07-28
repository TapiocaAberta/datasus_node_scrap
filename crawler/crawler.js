// -*- coding: utf-8 -*-
// Copyleft 2014 Paulo Luan <https://github.com/transparenciasjc>
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
var colors = require('colors');
var mongoProcessing = require('mongo-cursor-processing');
var request = require('request');
var Mongo = require('./mongo.js');

function downloadAll() {
    console.log('downloading all');
    Mongo.get_all_entities(function(entitiesCursor) {
        entitiesCursor.count(function(error, entitiesCount) {
            console.log('quantidade de registros: ', entitiesCount);
            var count = 0;

            function showMessage() {
                count++;
                var message = count + ' de ' + entitiesCount;
                console.log(message.green);
            }
            var processItem = function(doc, done) {
                Mongo.isEntityAlreadyDownloaded(doc, function(databaseResultDocument, documentExists) {
                    if (!documentExists)
                    // download entity only if it was not downloaded.
                    {
                        if (doc && doc.url) {
                            downloadEntity(doc.url, function() {
                                showMessage();
                                Mongo.remove_downloaded_url(doc.url);
                                doc = null;
                                databaseResultDocument = null;
                                processItem = null;
                                global.gc();
                                return done();
                            });
                        }
                    } else {
                        Mongo.remove_downloaded_url(databaseResultDocument.url);
                        return done();
                    }
                });
            };
            mongoProcessing(entitiesCursor, processItem, 10, function(err) {
                if (err) {
                    console.error('on noes, an error', err);
                    process.exit(1);
                }
            });
        });
    });
}

function initialize() {
    var callback = function() {
        //download_states('http://cnes.datasus.gov.br/Lista_Tot_Es_Estado.asp')
        //download_cities('http://cnes.datasus.gov.br/Lista_Tot_Es_Municipio.asp?Estado=35&NomeEstado=SAO%20PAULO')
        //download_entities_urls('http://cnes.datasus.gov.br/Lista_Es_Municipio.asp?VEstado=35&VCodMunicipio=354990&NomeEstado=SAO%20PAULO')
        //var url = 'http://cnes.datasus.gov.br/Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=3549906891136&VEstado=35&VCodMunicipio=354990'
        //download_entity(url, function() { console.log('baixado!!!') })
        //initialize_urls()
        //download_all();
        Mongo.exportToCSV();
    };
    Mongo.initialize_db(callback);
}
// http://cnes.datasus.gov.br/Lista_Tot_Es_Estado.asp
// http://cnes.datasus.gov.br/Lista_Tot_Es_Municipio.asp?Estado=35&NomeEstado=SAO%20PAULO
// http://cnes.datasus.gov.br/Lista_Es_Municipio.asp?VEstado=35&VCodMunicipio=354990&NomeEstado=SAO%20PAULO
// http://cnes.datasus.gov.br/Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=3549906891136&VEstado=35&VCodMunicipio=354990
initialize();