// Pay - /app/controllers/tickets/index.js

// Tickets controller

'use strict';

var get = require('./get');

module.exports = function (db) {
    return {
        get: get(db)
    };
};
