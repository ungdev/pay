///////////////////////////////////////////
// Factory to parse prices from database //
///////////////////////////////////////////

'use strict';

pay.factory('ParsePrices', [
    '$timeout',
    '$http',
    'Error',
    function ($timeout, $http, Error) {
        function ParsePrices () {
            /**
             * Parses prices from an event object
             * @param {object} e Event object
             */
            this.fromEvent = function (e) {
                var name = e.name;
                var prices = e.Prices;
                var $prices = $('.prices label');
                var existingPrices = [
                    'Prix étudiant cotisant en prévente',
                    'Prix étudiant cotisant hors prévente',
                    'Prix étudiant non-cotisant en prévente',
                    'Prix étudiant non-cotisant hors prévente',
                    'Prix extérieur en prévente',
                    'Prix extérieur hors prévente'
                ];

                if (typeof prices !== 'object') {
                    return;
                }

                prices.forEach(function (price) {
                    var nameSplitted = price.name.split(name + ' - ');

                    if (typeof nameSplitted[1] === 'undefined') {
                        return;
                    }

                    var priceName = nameSplitted[1].trim();
                    var indexPrice = existingPrices.indexOf(priceName);

                    if (indexPrice === -1) {
                        return;
                    }

                    var $target = $prices.eq(indexPrice).children();
                    $target.first().prop('checked', true);
                    $target.last().val(price.price);
                    $timeout(function () {
                        if (!$target.last().data().$ngModelController) {
                            return;
                        }
                        $target.last().data().$ngModelController.$setViewValue($target.last().val());
                    }, 0);
                });
            };

            /**
             * Updates an event given a price object
             * @param {object}   e        Event object
             * @param {object}   prices   Price object
             * @param {Function} callback Callback
             */
            this.toEvent = function (e, prices, callback) {
                var name = e.name;
                var existingPrices = {
                    priceEtucotPresale: 'Prix étudiant cotisant en prévente',
                    priceEtucot:        'Prix étudiant cotisant hors prévente',
                    priceEtuPresale:     'Prix étudiant non-cotisant en prévente',
                    priceEtu:            'Prix étudiant non-cotisant hors prévente',
                    priceExtPresale:     'Prix extérieur en prévente',
                    priceExt:            'Prix extérieur hors prévente'
                }

                var keys   = Object.keys(prices);
                var length = keys.length;

                keys.forEach(function (price, i) {
                    // Given price must exist
                    if (!existingPrices.hasOwnProperty(price)) {
                        return;
                    }

                    // The event should have it or create it
                    if (typeof e.Prices[i] === 'undefined') {
                        $http.put('api/events/' + e.id + '/prices', {
                            name: e.name + ' - ' + existingPrices[price],
                            price: prices[price]
                        }).then(angular.noop, function (res) {
                            Error('Erreur', res.data.error);
                        });
                        return;
                    }

                    // The events should have the same name
                    if (e.Prices[i].name !== name + ' - ' + existingPrices[price]) {
                        return;
                    }

                    // Update the price
                    e.Prices[i].price = prices[price];
                    $http.post('api/events/' + e.id + '/prices/' + e.Prices[i].id, {
                        price: e.Prices[i].price
                    }).then(function () {
                        if (typeof callback === 'function' && i === length - 1) { callback(); }
                    }, function (res) {
                        Error('Erreur', res.error);
                        if (typeof callback === 'function' && i === length - 1) { callback(); }
                    });
                });
            }
        }

        return new ParsePrices();
    }
]);
