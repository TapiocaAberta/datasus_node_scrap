var module = require('../mongoose'),
    path = require('path'),
    _ = require('lodash'),
    fs = require('fs'),
    should = require('should');
describe('#save_entity', function() {
    it('should save, find and delete an entity', function(done) {
        var json = {
            'Nome': 'VOTOMED MEDICOS ASSOCIADOS',
            'CNES': '3507823',
            'CNPJ': '04164623000150',
            'Nome Empresarial': 'VOTOMED MEDICOS ASSOCIADOS',
            'CPF': '--',
            'Personalidade': 'JUR\xCDDICA',
            'Logradouro': 'R IZALTINO DIAS',
            'N\xFAmero': '63',
            'Telefone': '(15)32471794',
            'Complemento': '',
            'Bairro': 'CENTRO',
            'CEP': '18110030',
            'Munic\xEDpio': 'VOTORANTIM - IBGE - 355700',
            'UF': 'SP',
            'Tipo Estabelecimento': 'CONSULTORIO ISOLADO',
            'Sub Tipo Estabelecimento': '',
            'Esfera Administrativa': 'PRIVADA',
            'Gest\xE3o': 'MUNICIPAL',
            'Natureza da Organiza\xE7\xE3o': 'EMPRESA PRIVADA',
            'Depend\xEAncia': 'INDIVIDUAL',
            'N\xFAmero Alvar\xE1': '',
            '\xD3rg\xE3o Expedidor': 'SMS',
            'Data Expedi\xE7\xE3o': '',
            'url': 'http://cnes.datasus.gov.br/Exibe_Ficha_Estabelecimento.asp?VCo_Unidade=3557003507823&VEstado=35&VCodMunicipio=355700',
            'VCo_Unidade': '3557003507823',
            'VEstado': '35',
            'VCodMunicipio': '355700',
            '_id': ObjectId('53f8a8e89487e0af2092c597')
        };
        module.save([json]).then(function(result) {
            return result;
        }).then(function(result) {
            var searchJson = {
                _id: result._id
            };
            module.findOne(searchJson).then(function(findResult) {
                var toDelete = {
                    _id: findResult._id
                };
                module.delete(toDelete).then(function() {
                    done();
                }).catch(function(error) {
                    done(error);
                });
            });
        }).catch(function(error) {
            done(error);
        });
    });
});