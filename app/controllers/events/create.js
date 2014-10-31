// Pay - /app/controllers/events/create.js

// Event creator

'use strict';

var fs   = require('fs');
var path = require('path');
var moment = require('moment');

module.exports = function (db) {
    return function (req, res) {
        if (!req.form.isValid) {
            Error.emit(res, 400, '400 - Bad Request', req.form.errors);
            return;
        }

        var form = req.form;

        // Save image to upload/
        var base64Regex = /^data:\w+\/(\w+);base64,([a-zA-Z0-9+\/=]+)$/;
        var matches = form.image.match(base64Regex);
        
        var ext = matches[1];
        var data = matches[2];
        
        var buffer = new Buffer(data, 'base64');

        var opath = path.resolve(process.cwd() + '/app/public/static/img/upload');
        var oname = form.name.replace(/\W+/ig, '-') + '.' + ext;
        opath = (opath + '/' + oname).toLowerCase();
        fs.writeFile(opath, buffer, function (err) {
            if (err) {
                Error.emit(res, 500, '500 - Cannot write file', err.toString());
            }

            db.Event.create({
                name: form.name,
                picture: path.basename(opath),
                description: form.description,
                date: new Date(form.date),
                maximumTickets: form.maximumTickets,
                opened: false
            }).complete(function (err, newEvent) {
                if (err) {
                    if (err.name === 'SequelizeUniqueConstraintError') {
                        Error.emit(res, 400, '400 - Duplicate event');
                        return;
                    }
                    Error.emit(null, 500, '500 - SQL Server error', err.toString());
                }

                // Create prices
                // Price Etu cott in presale :
                db.Price.create({
                    name: form.name + ' - Prix étudiant cottisant en prévente',
                    price: form.priceEtuCottPresale
                }).complete(function (err, priceEtuCottPresale) {
                    if (err) {
                        Error.emit(null, 500, '500 - SQL Server error', err.toString());
                    }

                    newEvent.setPrice(priceEtuCottPresale);
                });
                // Price Etu cott not in presale :
                db.Price.create({
                    name: form.name + ' - Prix étudiant cottisant hors prévente',
                    price: form.priceEtuCott
                }).complete(function (err, priceEtuCott) {
                    if (err) {
                        Error.emit(null, 500, '500 - SQL Server error', err.toString());
                    }

                    newEvent.setPrice(priceEtuCott);
                });
                // Price Etu in presale :
                if (form.priceEtuPresaleActive) {
                    db.Price.create({
                        name: form.name + ' - Prix étudiant non-cottisant en prévente',
                        price: form.priceEtuPresale
                    }).complete(function (err, priceEtuPresale) {
                        if (err) {
                            Error.emit(null, 500, '500 - SQL Server error', err.toString());
                        }

                        newEvent.setPrice(priceEtuPresale);
                    });
                }
                // Price Etu not in presale :
                if (form.priceEtuActive) {
                    db.Price.create({
                        name: form.name + ' - Prix étudiant non-cottisant hors prévente',
                        price: form.priceEtu
                    }).complete(function (err, priceEtu) {
                        if (err) {
                            Error.emit(null, 500, '500 - SQL Server error', err.toString());
                        }

                        newEvent.setPrice(priceEtu);
                    });
                }
                // Price Ext in presale :
                if (form.priceExtPresaleActive) {
                    db.Price.create({
                        name: form.name + ' - Prix extérieur en prévente',
                        price: form.priceExtPresale
                    }).complete(function (err, priceExtPresale) {
                        if (err) {
                            Error.emit(null, 500, '500 - SQL Server error', err.toString());
                        }

                        newEvent.setPrice(priceExtPresale);
                    });
                }
                // Price Ext not in presale :
                if (form.priceExtActive) {
                    db.Price.create({
                        name: form.name + ' - Prix extérieur hors prévente',
                        price: form.priceExt
                    }).complete(function (err, priceExt) {
                        if (err) {
                            Error.emit(null, 500, '500 - SQL Server error', err.toString());
                        }

                        newEvent.setPrice(priceExt);
                    });
                }

                res.json({
                    status: 200,
                    id: newEvent.id
                });
                res.end();
            });
        });
    };
};
