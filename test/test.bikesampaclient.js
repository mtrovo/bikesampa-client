'use strict';

var assert = require('assert');
var nock = require('nock');
var BikeSampaClient = require('../lib/bikesampaclient.js').BikeSampaClient;

var client;

var TEST_STATION = {
    "CodArea": "21",
    "CodTipo": "3",
    "Endereco": "Rua Morgado de Mateus, em frente ao numero 652",
    "IdEstacao": "1",
    "Latitude": "-23.587315",
    "Longitude": "-46.647974",
    "Nome": "Instituto Biologico",
    "QtdBicicletas": "1",
    "QtdPosicaoLivre": "11",
    "Referencia": "",
    "StatusOnline": "I",
    "StatusOperacao": "EO",
    "estacaoIntegradaBU": "N",
    "qtdBicicletasDisponiveisEstacao": "1",
    "statusEstacao": "Est_Normal 1"
};

describe('BikeSampaClient', function() {
    beforeEach(function setupEachTest() {
        client = new BikeSampaClient();
    });
    describe('@_statusForStation', function() {
        it('should transform working status', function(){
            assert.equal('working', BikeSampaClient._statusForStation('A', 'EO'));
            assert.notEqual('working', BikeSampaClient._statusForStation('I', 'EO'));
            assert.notEqual('working', BikeSampaClient._statusForStation('A', 'I'));
        });
        it('should transform maintenance status', function(){
            assert.equal('maintenance', BikeSampaClient._statusForStation('A', 'EM'));
            assert.equal('maintenance', BikeSampaClient._statusForStation('I', 'EM'));
        });
        it('should transform deploying status', function(){
            assert.equal('deploying', BikeSampaClient._statusForStation('A', 'EI'));
            assert.equal('deploying', BikeSampaClient._statusForStation('I', 'EI'));
        });
        it('should transform offline status', function(){
            assert.equal('offline', BikeSampaClient._statusForStation('I', 'EO'));
        });
    });

    describe('@_normalizeStationModel', function() {
        it('should transform acceptsBilheteUnico', function() {
            assert.equal(true, BikeSampaClient._normalizeStationModel({estacaoIntegradaBU: 'S'}).acceptsBilheteUnico);
            assert.equal(false, BikeSampaClient._normalizeStationModel({estacaoIntegradaBU: 'N'}).acceptsBilheteUnico);
        });

        it('should transform status', function() {
            assert.equal('working', BikeSampaClient._normalizeStationModel({StatusOnline: "A", StatusOperacao:'EO'}).status);
            assert.equal('maintenance', BikeSampaClient._normalizeStationModel({StatusOperacao:'EM'}).status);
            assert.equal('deploying', BikeSampaClient._normalizeStationModel({StatusOperacao: 'EI'}).status);
            assert.equal('offline', BikeSampaClient._normalizeStationModel({StatusOnline: "I",StatusOperacao: "EO"}).status);
        });

        it('should transform full object', function(){
            assert.deepEqual({
                    "stationId":"1",
                    "name":"Instituto Biologico",
                    "address":"Rua Morgado de Mateus, em frente ao numero 652",
                    "reference":"",
                    "lat":"-23.587315",
                    "lng":"-46.647974",
                    "status":"offline",
                    "acceptsBilheteUnico":false,
                    "freePositions":11,
                    "availableBikes":1
            }, BikeSampaClient._normalizeStationModel(TEST_STATION));
        });
    });

    describe('#getAll', function() {
        it('should fetch all expected stations', function(done) {
            nock(BikeSampaClient.FETCH_PROTOCOL + BikeSampaClient.FETCH_HOST)
                .get(BikeSampaClient.FETCH_PATH)
                .reply(200, {
                    "RSListEstacao": {
                        "ListEstacao": [TEST_STATION],
                        "houveErro": "False",
                        "msg": "Ok"
                }});
            
            client.getAll(function(err, stations) {
                if(err) done(err);
                else{
                    assert.equal(1, Object.keys(stations).length);
                    assert.ok(stations['1']);
                    assert.deepEqual({
                        "stationId":"1",
                        "name":"Instituto Biologico",
                        "address":"Rua Morgado de Mateus, em frente ao numero 652",
                        "reference":"",
                        "lat":"-23.587315",
                        "lng":"-46.647974",
                        "status":"offline",
                        "acceptsBilheteUnico":false,
                        "freePositions":11,
                        "availableBikes":1
                    }, stations['1']);
                    done();
                }
            })
        });
    });
});