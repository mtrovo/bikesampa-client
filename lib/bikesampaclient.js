"use strict";
var request = require("request");
var BikeSampaClient = function (options) {
    options = options || {};
    this._url = options.url || BikeSampaClient.FETCH_URL;
};

BikeSampaClient.FETCH_PROTOCOL = "https://";
BikeSampaClient.FETCH_HOST = "bikesampa.mobilicidade.mobi";
BikeSampaClient.FETCH_PATH = "/WSAppBKSampa/servicojsonbksampa.aspx?autenticar=m0Bc2012.2BkSP&operacao=RecEstacoesStatus&nestacao=0";
BikeSampaClient.FETCH_URL = BikeSampaClient.FETCH_PROTOCOL + BikeSampaClient.FETCH_HOST + BikeSampaClient.FETCH_PATH;

BikeSampaClient._statusForStation = function (statusOnline, statusOperacao) {
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

BikeSampaClient._normalizeStationModel = function (el) {
    return {
        stationId: el.IdEstacao,
        name: el.Nome,
        address: el.Endereco,
        reference: el.Referencia,
        lat: el.Latitude,
        lng: el.Longitude,
        status: BikeSampaClient._statusForStation(el.StatusOnline, el.StatusOperacao),
        acceptsBilheteUnico: el.estacaoIntegradaBU === 'S',
        freePositions: parseInt(el.QtdPosicaoLivre),
        availableBikes: parseInt(el.QtdBicicletas)
    };
};

BikeSampaClient.prototype.getAll = function (callback) {
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
        } else if (body.houveErro === "True") {
            callback(body.msg);
        } else {
            var idEstacaoKeyReducer = function (ac, el) {ac[el.stationId] = el; return ac; };
            var stations = body.RSListEstacao.ListEstacao.map(function (el) {
                return BikeSampaClient._normalizeStationModel(el);
            }).reduce(idEstacaoKeyReducer, {});
            callback(null, stations);
        }
    });
};

BikeSampaClient.prototype.getStation = function (id, callback) {
    this.getAll(function(err, stations){
        if(err){
            callback(err);
        } else {
            callback(null, stations[id]);
        }
    });
};

function CachedBikeSampaClient(options){
    this.delegate = new BikeSampaClient(options);
    this.ttl = (options.ttl || 30) * 1000;
    this.lastModified = 0;
}
CachedBikeSampaClient.prototype.isCacheValid = function() {
    if(!this.cache) return false;
    var delta = new Date().getTime() - this.lastModified;
    return delta < this.ttl;
};

CachedBikeSampaClient.prototype.getAll = function (callback) {
    if(this.isCacheValid()) {
        callback(null, this.cache);
    } else {
        var _this = this;
        this.delegate.getAll(function(err, stations) {
            _this.cache = stations;
            _this.lastModified = new Date().getTime();
            callback(err, stations);
        });
    }
};
CachedBikeSampaClient.prototype.getStation = function(id, callback) {
    if(this.isCacheValid()){
        callback(null, this.cache[id]);
    } else {
        this.getAll(function(err, stations){
            callback(err, stations[id]);
        });
    }
};

module.exports = {
    BikeSampaClient: BikeSampaClient,
    CachedBikeSampaClient: CachedBikeSampaClient
}