'use strict';

var assert = require('assert');
var nock = require('nock');
var BikeSampaClient = require('../lib/bikesampaclient.js').BikeSampaClient;
var fs = require('fs');
var _ = require('underscore');
var path = require('path');
var expect = require('chai').expect;

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

function isTest(f) {
  return (/\.test\.html$/).test(f);
}

function isExpectation(f) {
  return (/\.expectation\.js$/).test(f);
}

describe('BikeSampaClient', function() {

    var casefiles = [];
    fs.readdirSync(__dirname + '/html-cases/').forEach(function (f) {
      return casefiles.push(path.normalize(__dirname + '/html-cases/' + '/' + f));
    });
    
    var tests = casefiles.filter(isTest);
    tests.sort();
    
    var expectations = casefiles.filter(isExpectation);
    expectations.sort();

    var cases = _.zip(tests, expectations);

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
    
    describe('@_buildObjectsFromStringFunc', function() {
        it('should read single station correctly', function() {
            var func = fs.readFileSync(__dirname + '/html-cases/singlestation.expectation.js', {encoding:"UTF-8"});
            var stations = BikeSampaClient._buildObjectsFromStringFunc(func);

            assert.deepEqual([{
                "Endereco": "Rua Morgado de Mateus, em frente ao numero 652",
                "IdEstacao": "1",
                "Latitude": "-23.587315",
                "Longitude": "-46.647974",
                "Nome": "Instituto Biologico",
                "QtdBicicletas": "0",
                "QtdPosicaoLivre": "12",
                "Referencia": "",
                "StatusOnline": "I",
                "StatusOperacao": "EM",
                "estacaoIntegradaBU": "S",
                "qtdBicicletasDisponiveisEstacao": "0",
                "statusEstacao": null,
            }], stations);
        });
    });

    describe('@_sliceStationsInfoFromHtml', function() {
        cases.forEach(function(cur){
            var test = cur[0], exp = cur[1];
            
            var radical = _.last(exp.split(/\./)[0].split('/'));
            it('should fetch only stations info #' + radical, function(){
                var content = fs.readFileSync(test, {encoding: 'UTF-8'});
                var expected = fs.readFileSync(exp, {encoding: 'UTF-8'});
                assert.equal(BikeSampaClient._sliceStationsInfoFromHtml(content), expected);
            });
        })
    });

    describe('#getAll', function() {
        it('should fetch all expected stations', function(done) {
            nock(BikeSampaClient.FETCH_PROTOCOL + BikeSampaClient.FETCH_HOST)
                .get(BikeSampaClient.FETCH_PATH)
                .reply(200, fs.readFileSync(__dirname + '/html-cases/station1.html'));
            
            client.getAll(function(err, stations) {
                if(err) done(err);
                else{
                    expect(Object.keys(stations).length).to.equal(1);
                    expect(stations['1']).to.be.ok;
                    expect(stations['1']).to.deep.equal({
                        "stationId":"1",
                        "name":"Instituto Biologico",
                        "address":"Rua Morgado de Mateus, em frente ao numero 652",
                        "reference":"",
                        "lat":"-23.587315",
                        "lng":"-46.647974",
                        "status":"offline",
                        "acceptsBilheteUnico":true,
                        "freePositions":11,
                        "availableBikes":1
                    });
                    done();
                }
            })
        });
    });
});