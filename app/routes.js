/////////////
// Routing //
/////////////

'use strict';

var validators = require('./controllers/validators');
var validator  = require('validator');

module.exports = function (router, db, config) {
    var controllers = require('./controllers')(db, config);
    var auth       = require('./lib/auth')(db, config);

    // Main auth
    // Checks if there is a token every request
    router.use(auth.checkToken);

    ////////////
    // Events //
    ////////////

    router.route('/events').
        // Gets all events
        get(
            auth.noAuth,
            controllers.events.getAll
        )
        // Creates an event
        .post(
            auth.isFundationAccount,
            validators.createEvent,
            controllers.events.create
        )
        // Updates an event
        .put(
            auth.isInEvent('admin'),
            validators.editEvent,
            controllers.events.edit
        );

    router.route('/events/:eventId')
        // Deletes an event
        .delete(
            auth.isInEvent('admin'),
            controllers.events.remove
        )
        // Gets an event's details
        .get(
            auth.isInEvent('admin'),
            controllers.events.getOne
        );

    /////////////////////
    // Event's tickets //
    /////////////////////

    router.route('/events/:eventId/tickets')
        // Gets all tickets from an event (stats)
        .get(
            auth.isInEvent('admin'),
            controllers.tickets.getAllFromEvent
        );

    ////////////////////
    // Event's prices //
    ////////////////////

    router.route('/events/:eventId/prices')
        // Gets all prices from an event
        // Can be used by no-auth clients to buy a ticket (and they need the price)
        .put(
            auth.noAuth,
            validators.createPrice,
            controllers.events.createPrice
        );

    router.route('/events/:eventId/prices/:priceId')
        // Updates an event price
        .post(
            auth.isInEvent("admin"),
            validators.editPrice,
            controllers.events.editPrice
        );


    //////////////////////
    // Event's accounts //
    //////////////////////

    router.route('/etu/search/')
        // Searches among users list
        .get(
            auth.isInEvent('admin'),
            controllers.etu.searchUsers
        );

    router.route('/events/:eventId/accounts')
        // Create an account
        .post(
            auth.isFundationAccount,
            validators.createAccount,
            controllers.accounts.create
        )
        // Get all the accounts
        .get(
            auth.isFundationAccount,
            controllers.accounts.getAll
        );
    router.route('/accounts/:accountId')
        // Deletes an account
        .delete(
            auth.isFundationAccount,
            controllers.accounts.remove
        );
    router.route('/accounts/:userId')
        // Gets all accounts with a given user id
        .get(
            auth.noAuth,
            controllers.accounts.getAllFromUserId
        );

    /////////////
    // Tickets //
    /////////////

    router.route('/tickets')
        // Gets all tickets from tickets list
        .get(
            auth.noAuth,
            controllers.tickets.getAll
        );

    ////////////////////
    // School domains //
    ////////////////////

    router.route('/domains/')
        // Gets all domains
        .get(
            auth.isSuperAdmin,
            controllers.domains.getAll
        )
        // Creates a domain
        .post(
            auth.isSuperAdmin,
            validators.createDomain,
            controllers.domains.create
        );
    router.route('/domains/:domainId')
        // Deletes a domain
        .delete(
            auth.isSuperAdmin,
            controllers.domains.remove
        );

    // Bank Price
    router.route('/bankPrice/')
        .get(
            auth.isSuperAdmin,
            controllers.bankPrice.get
        )
        .post(
            auth.isSuperAdmin,
            validators.editBankprice,
            controllers.bankPrice.edit
        );

    //////////
    // User //
    //////////

    router.route('/etu/login')
        // Auth etu
        .post(
            auth.noAuth,
            validators.etuLogin,
            controllers.etu.login,
            auth.addAuth
        );

    router.route('/etu/block')
        .put(
            auth.isAuth,
            controllers.etu.block
        );

    router.route('/print/')
        // Ticket printer
        .get(
            auth.isAuth,
            controllers.tickets.print
        );

    router.route('/forgot/:mail')
        // Forgot tickets
        .get(
            auth.isAuth,
            controllers.tickets.forgot
        );

    router.route('/purchases/')
        // Buckutt History - Purchases
        .get(
            auth.isAuth,
            controllers.buckuttHistory.getPurchasesHistory
        );
    router.route('/reloads/')
        // Buckutt History - Reloads
        .get(
            auth.isAuth,
            controllers.buckuttHistory.getReloadsHistory
        );

    /* Params filters */
    var justIds = ['eventId', 'priceId', 'domainId', 'accountId', 'userId'];
    justIds.forEach(function (idName) {
        router.param(idName, function (req, res, next, id) {
            if (Number.isPositiveNumeric(id)) {
                req.body[idName] = id;
                next();
            } else {
                Error.emit(res, 400, '400 - Bad Request');
            }
        });
    });

    router.param('token', function (req, res, next, token) {
        var reg = /^.+$/;
        if (reg.test(token)) {
            req.params.token = token;
            next();
        } else {
            Error.emit(res, 400, '400 - Bad Request');
        }
    });

    router.param('mail', function (req, res, next, mail) {
        if (validator.isEmail(mail)) {
            req.params.mail = mail;
            next();
        } else {
            Error.emit(res, 400, '400 - Bad Request');
        }
    });
};
