'use strict';

var _ = require('lodash'),
    Promise = require('bluebird');

module.exports = function (knex) {
    return function (model, data) {
        return new Promise(function (resolve, reject) {
            knex.raw(`describe ${model}`).then(function (response) {
                //-- Buscar si hay algún dato que su nombre empiece por "_" y no este en el objeto de datos
                _.each(response[0], function (row) {
                    var field = row.Field;
                    if(/^_/gi.test(field) && !data[field] && data[field.substr(1)]) {
                        data[field] = data[field.substr(1)];
                    }
                });
    
                data = _.pick(data || {}, _.map(response[0], 'Field'));
        
                for (var name in data) {
                    if(['null', 'undefined', undefined, null].indexOf(data[name]) >= 0) {
                        delete data[name];
                    } else {
                        //-- Si es un json, entonces convertir a texto
                        try {
                            var info = data[name];
                            data[name] = (info && typeof info == "object")? JSON.stringify(info) : info;
                        } catch (e) { }
                    }
                }
        
                resolve(data);
            }).catch(reject);
        });
    };
};