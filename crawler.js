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
var mongoProcessing = require('mongo-cursor-processing')
var request = require('request');

var Mongo = require('./mongo.js');
var base_url = 'http://cnes.datasus.gov.br/'

// Parsear todos os estados pegando os ids
function get_base_url() {
      var states_url = base_url + 'Lista_Tot_Es_Estado.asp'
      return states_url
}

function get_plain_html(url, callback) {
      var params = {
            uri     : url,
            method  : "GET",
            encoding: 'binary',
            gzip    : true
      };

      var onResponse = function (error, response, html) {
            if (!error) {
                  var env = require('jsdom').env

                  console.log('criando o documento ')

                  iconv = require('iconv-lite');
                  var utf8String = iconv.decode(new Buffer(html), "UTF-8");

                  env(utf8String, function (errors, window_doc) {
                        var $ = require('jquery')(window_doc)
                        callback($, url);

                        $ = null;
                        window_doc = null;
                  });

                  error = null; 
                  response = null;
                  html = null;

            } else {
                  console.log(error);
            }
      };

      var replay = require('request-replay');
      replay(request(params, onResponse));
}

function parse_states(html_document, url) {
      states = []

      var table = html_document("div[style = 'width:300; height:209; POSITION: absolute; TOP: 185px; LEFT: 400px; overflow:auto'] table")
      var trs = html_document(table).find('tr')

      for (var i = trs.length - 1; i >= 0; i--) {
            var tds = html_document(trs[i]).find('td')

            var state_json = {}
            state_json['estado_nome'] = html_document(tds[0]).text()
            state_json['estado_total'] = html_document(tds[1]).text()
            state_json['estado_%'] = html_document(tds[2]).text()
            state_json['url'] = base_url + html_document(tds[0]).find('a').attr('href')

            var params = getQueryStrings(url);
            if (params) state_json = merge_json(state_json, params);

            state_json = removeSpacesAndTabsFromString(state_json)

            states.push(state_json)
      }

      html_document = null
      table = null
      trs = null

      return states
}

function parse_cities(html_document, url) {
      var cities = []

      var table = html_document("div[style = 'width:450; height:300; POSITION: absolute; TOP: 201px; LEFT: 180px; overflow:auto'] table")
      var trs = html_document(table).find('tr')

      for (var i = trs.length - 1; i >= 0; i--) {
            var tds = html_document(trs[i]).find('td')

            var city_json = {}
            city_json['cidade_IBGE'] = html_document(tds[0]).text()
            city_json['cidade_nome'] = html_document(tds[1]).text()
            city_json['cidade_cadastrados'] = html_document(tds[2]).text()
            city_json['url'] = base_url + html_document(tds[1]).find('a').attr('href')

            var params = getQueryStrings(url);
            city_json = merge_json(city_json, params);

            city_json = removeSpacesAndTabsFromString(city_json)

            cities.push(city_json)
      }

      html_document = null
      table = null
      trs = null

      return cities
}

function get_entities_urls_from_city(html_document) {
      entities = []

      var div = html_document.find("div[style='width:539; height:500; POSITION: absolute; TOP:198px; LEFT: 121px; overflow:auto']")
      var table = html_document(div).find("table");
      var links = html_document(div).find("a");

      for (var i = links.length - 1; i >= 0; i--) {
            var entity_url_object = {"url": base_url + links[i].getAttribute('href')}

            var params = getQueryStrings(base_url + links[i].getAttribute('href'));
            entity_url_object = merge_json(entity_url_object, params);

            entities.push(entity_url_object);
      }

      html_document = null
      div = null
      table = null
      links = null

      return entities
}

function parse_entity_data(html_document, url) {
      var json = {}

      var table_entity = html_document.find("table[bgcolor= 'white']") // the table that has the properties is the only that the bg is 'white'
      var rows = html_document(table_entity).find('tr')

      for (var tr_index = 0; tr_index < rows.length; tr_index += 2) {
            var td_keys = html_document(rows[tr_index]).find('td')
            var values = html_document(rows[tr_index + 1]).find('td')

            for (var td_index = 0; td_index < td_keys.length; td_index++) {
                  var key = td_keys[td_index].textContent.replace(':', '')
                  var value = values[td_index].textContent

                  json[key] = value
            }
      }

      var params = getQueryStrings(url);
      json['url'] = url
      json = merge_json(json, params);

      json = removeSpacesAndTabsFromString(json)

      html_document = null
      table_entity = null
      rows = null
      params = null

      return json
}

function merge_json(json1, json2) {
      var json2_keys = Object.keys(json2) // TODO: how to get keys in a javascript object?

      for (var i = 0; i < json2_keys.length; i++) {
            var key = json2_keys[i]
            var value = json2[json2_keys[i]]
            json1[key] = value
      }

      json2 = null

      return json1
}

function merge_entity_with_cities(state, city, entity) {
      base_json = merge_json(state, city)

      entity_json = parse_entity_data(entity)
      json = merge_json(base_json, entity_json)

      json = removeSpacesAndTabsFromString(json)

      base_json = null
      entity_json = null

      Mongo.save_to_db(json)

      json = null;
}


function removeSpacesAndTabsFromString(json) {
      var json_keys = Object.keys(json);

      for (key in json_keys) {
            json[json_keys[key]] = json[json_keys[key]].replace(/^\s+|\s+$/g, "");
      }

      json_keys = null

      return json
}

function getQueryStrings(url) {
      var result;
      var url_params = url.indexOf('?') + 1

      if (url_params) {
            var qs = url.substring(url_params).split('&');

            if (qs) {
                  for (var i = 0, result = {}; i < qs.length; i++) {
                        qs[i] = qs[i].split('=');
                        result[qs[i][0]] = decodeURIComponent(qs[i][1]);
                  }
            }
      }

      return result;
}



function download_states(base_url) {
      console.log('Baixando estados: ', base_url)
      get_plain_html(base_url, function (html_document, url) {
            console.log('recebido os estados!!')
            var states = parse_states(html_document, url)
            Mongo.save_states(states)

            for (var i = 0; i < states.length; i++) {
                  console.log(i, " de ", states.length)
                  download_cities(states[i].url)
            }

            states = null;
      })
}

function download_cities(state_url) {
      console.log('Baixando Cidades: ', state_url)
      get_plain_html(state_url, function (html_document, url) {
            var cities = parse_cities(html_document, url)
            Mongo.save_cities(cities)

            for (var i = 0; i < cities.length; i++) {
                  download_entities_urls(cities[i].url)
            }

            cities = null;
      })
}

function download_entities_urls(city_url, callbackOnSuccess) {
      console.log('Baixando Entidades da cidade: ', city_url)
      get_plain_html(city_url, function (html_document, url) {
                var entities_urls = get_entities_urls_from_city(html_document)
                console.log("preparando para salvar! ", entities_urls.length)
                Mongo.save_entity_url(entities_urls)

                entities_urls = null;

                callbackOnSuccess();
          }
      )
}

function download_entity(entity_url, callbackOnSuccess) {
      get_plain_html(entity_url, function (html_document, url) {
            var entity = parse_entity_data(html_document, url);
            entity = removeSpacesAndTabsFromString(entity);
            Mongo.save_entity(entity);

            entity = null;

            callbackOnSuccess();
      });
}

function initialize_urls() {
      var cities = Mongo.getAllCities(function (citiesCursor) {
            var processItem = function(item, done) {
                  var download_reference;

                  var onFinish = function() {
                        processItem = null;
                        download_reference = null
                        global.gc();
                        done();
                  }

                  download_reference = download_entities_urls(item.url, onFinish)
            }

            mongoProcessing(citiesCursor, processItem, 20 function (err) {
                  if (err) {
                        console.error('on noes, an error', err)
                        process.exit(1)
                  }
            })
      });
}

function download_all() {
      console.log("downloading all")

      Mongo.get_all_entities(function (entities_cursor) {
            entities_cursor.count(function (error, entities_count) {
                  console.log("quantidade de registros: ", entities_count)

                  var count = 0;

                  function showMessage() {
                        count++;
                        var message = count + " de " + entities_count
                        console.log(message.green)
                  }

                  var processItem = function(doc, done) {

                        Mongo.isEntityAlreadyDownloaded(doc, function (databaseResultDocument, documentExists) {

                              if (!documentExists) // download entity only if it was not downloaded.
                              {
                                    if (doc && doc.url) {
                                          download_entity(doc.url, function () {
                                                showMessage();
                                                done();

                                                doc = null;
                                                databaseResultDocument = null
                                                processItem = null;

                                                global.gc();
                                          });
                                    }
                              }
                              else {
                                    done();
                              }
                        });
                  }

                  mongoProcessing(entities_cursor, processItem, 20, function (err) {
                        if (err) {
                              console.error('on noes, an error', err)
                              process.exit(1)
                        }
                  })
            });
      });
}

function initialize() {
      var callback = function () {
            //download_states('http://cnes.datasus.gov.br/Lista_Tot_Es_Estado.asp')
            //download_cities('http://cnes.datasus.gov.br/Lista_Tot_Es_Municipio.asp?Estado=35&NomeEstado=SAO%20PAULO')
            //download_entities_urls('http://cnes.datasus.gov.br/Lista_Es_Municipio.asp?VEstado=35&VCodMunicipio=354990&NomeEstado=SAO%20PAULO')

            //var url = 'http://cnes.datasus.gov.br/Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=3549906891136&VEstado=35&VCodMunicipio=354990'
            //download_entity(url, function() { console.log('baixado!!!') })

            //initialize_urls()
            download_all();
      }

      Mongo.initialize_db(callback)
}

// http://cnes.datasus.gov.br/Lista_Tot_Es_Estado.asp
// http://cnes.datasus.gov.br/Lista_Tot_Es_Municipio.asp?Estado=35&NomeEstado=SAO%20PAULO
// http://cnes.datasus.gov.br/Lista_Es_Municipio.asp?VEstado=35&VCodMunicipio=354990&NomeEstado=SAO%20PAULO
// http://cnes.datasus.gov.br/Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=3549906891136&VEstado=35&VCodMunicipio=354990

initialize();