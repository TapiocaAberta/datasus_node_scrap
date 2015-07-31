var mongoose = require('mongoose');

var self = {
    City: mongoose.model('City', {
        'Estado': String,
        'NomeEstado': String,
        'cidade_IBGE': String,
        'cidade_cadastrados': String,
        'cidade_nome': String,
        'done': String,
        'url': String
    }),

    Entity: mongoose.model('Entity', {
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
    }),

    EntityUrl: mongoose.model('EntityUrl', {
        'url': String,
        'VCo_Unidade': String,
        'VEstado': String,
        'VCodMunicipio': String
    }),

    State: mongoose.model('State', {
        'estado_nome': String,
        'estado_total': String,
        'estado_%': String,
        'url': String
    })
};

module.exports = self;
