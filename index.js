'use strict';

var _ = require('lodash'),
    Promise = require('bluebird'),
    async = require('async');

var models = {};

module.exports = function (knex) {
    return function (model, data) {
        return new Promise(function (resolve, reject) {
            async.waterfall([
                function (cb) {
                    if(models[model]) {
                        return cb(null, models[model]);
                    }

                    knex.raw(`describe ${model}`).then(function (response) {
                        models[model] = response[0];
                        cb(null, data);
                    }).catch(cb);
                },

                function (rows, cb) {
                    //-- Buscar si hay algún dato que su nombre empiece por "_" y no este en el objeto de datos
                    _.each(rows, function (row) {
                        var field = row.Field;
                        if(/^_/gi.test(field) && !data[field] && data[field.substr(1)]) {
                            data[field] = data[field.substr(1)];
                        }
                    });
        
                    data = _.pick(data || {}, _.map(rows, 'Field'));

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

                    cb(null, data);
                }
            ], function (err, data) {
                if(err) {
                    return reject(err);
                }

                resolve(data);
            });
        });
    };
};