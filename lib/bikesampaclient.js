"use strict";
var request = require("request");
var BikeSampaClient = function (options) {
    options = options || {};
    this._url = options.url || BikeSampaClient.FETCH_URL;
};

BikeSampaClient.FETCH_URL = "https://bikesampa.mobilicidade.mobi/WSAppBKSampa/servicojsonbksampa.aspx?autenticar=m0Bc2012.2BkSP&operacao=RecEstacoesStatus&nestacao=0";
BikeSampaClient.prototype._statusForStation = function (statusOnline, statusOperacao) {
    if (statusOnline === "A" && statusOperacao === "EO") {
        return "working";
    }
    if (statusOperacao === "EM") {
        return "maintenance";
    }
    if (statusOperacao === "EI") {
        return "deploying";
    }
    return "offline";
};

BikeSampaClient.prototype._normalizeStationModel = function (el) {
    return {
        stationId: el.IdEstacao,
        name: el.Nome,
        address: el.Endereco,
        reference: el.Referencia,
        lat: el.Latitude,
        lng: el.Longitude,
        status: this._statusForStation(el.StatusOnline, el.StatusOperacao),
        acceptsBilheteUnico: el.estacaoIntegradaBU === 'S',
        freePositions: parseInt(el.QtdPosicaoLivre),
        availableBikes: parseInt(el.QtdBicicletas)
    };
};

BikeSampaClient.prototype.fetchFromWebsite = function (callback) {
    var opts = {
        url: this._url,
        json: true,
        strictSSL: false,
        headers: {
            'User-Agent': 'request'
        }
    };
    request.get(opts, function (err, resp, body) {
        if (err) {
            callback(err);
        } else {
            var idEstacaoKeyReducer = function (ac, el) {ac[el.stationId] = el; return ac; };
            var stations = body.RSListEstacao.ListEstacao.map(function (el) {
                return this._normalize_station_model(el);
            }).reduce(idEstacaoKeyReducer, {});
            callback(null, stations);
        }
    });
};

BikeSampaClient.prototype.getStation = function (id, callback) {
    this.fetchFromWebsite(function(err, stations){
        if(err){
            callback(err);
        } else {
            callback(null, stations[id]);
        }
    });
};


// TODO: implement
function CachedBikeSampaClient(){}

module.exports = [
    BikeSampaClient
];