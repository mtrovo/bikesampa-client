# BikeSampa Client (nao oficial)

BikeSampa é o programa de compartilhamento de bicicletas disponível na cidade de Sao Paulo.

Esta [página](http://ww2.mobilicidade.com.br/bikesampa/mapaestacao.asp) mostra uma lista com todas as estaçoes e seu estado atual de uso, porém o formato nao foi feito para ser reusado (código Javascript sendo gerado no servidor para prover dados, vamo la né, 2015 já chegou) e seria no mínimo _muito difícil_ de ser usado por outros aplicativos ou sites que adorariam enriquecer esse conteúdo.

Essa é uma tentativa minha de prover os dados para aplicaçoes Node.js.

Se o seu projeto é em outra linguagem pode também acessar esses dados através de uma API REST, ver o projeto [bikesampa-now](http://github.com/mtrovo/bikesampa-now).

## Instalaçao

```
npm install bikesampa-client
```

## Como usar

### BikeSampaClient
Cliente que controla o acesso a API

#### #getAll(callback)
Funçao assíncrona que retorna o estado atual de todas as estaçoes disponiveis.

```
bikesampa.getAll(function(err, stations) {
	if(err) {
		// error handling
	} else {
		// success
	}
});
```

No exemplo `err` é uma variável utilizada para mostrar se ocorreu algum erro na chamada e `stations` é um array contendo as informaçoes de todas as estacoes disponíveis.

Cada estacao segue o seguinte formato:
```
{
  "stationId": "143",
  "name": "Mackenzie",
  "address": "Rua Major Sertorio, oposto a lateral do numero 772",
  "reference": "",
  "lat": "-23.545323",
  "lng": "-46.651943",
  "status": "working",
  "acceptsBilheteUnico": true,
  "freePositions": 12,
  "availableBikes": 0
}
```

* stationId: Identificador único da estação (aquele número que vai escrito nas estações pra você colocar no celular e pegar a bike)
* name: Nome da estacão
* address: Endereço
* reference: Referência do endereço
* lat: latitude do ponto geográfico da estação
* lng: longitude do ponto geográfico da estação
* status: Estado de funcionamento, pode ter os seguintes valores:
	* working: estação em funcionamento
    * maintenance: estação em manutenção
    * deploying: estação em implantação
    * offline: estação não conectada a rede
* acceptsBilheteUnico: Flag indicando se a estação aceita ou não Bilhete Único (atualmente todas as estações aceitam só deixei aqui por compatibilidade)
* freePositions: posições disponíveis para devolução de uma bicicleta
* availableBikes: bicicletas disponíveis para retirada

#### #getStation(id, callback)
Função assíncrona que retorna a estação com o `id` passado como argumento de entrada.

```
bikesampa.getStation('143', function(err, station) {
	if(err) {
		// error handling
	} else {
		// success
	}
});
```

No examplo acima o callback recebe duas variáveis de entrada, `err` para indicar se ocorreu algum erro na chamada e `station` com os dados da estação encontrada.

O formato dos dados da estação é o mesmo da chamada a função `#getAll`.

### CachedBikeSampaClient

Essa classe se utiliza da mesma API pública da classe `BikeSampaClient` porém as chamadas externas a página do BikeSampa são gravadas em cache com tempo de expiração configurados na criação.

É extremamente aconselhável o uso em cache pois a chamada ao serviço externo é bem lenta (>4s) e os dados não são modificados com tanta frequência.

#### #constructor(options)
Cria uma nova instância de `CachedBikeSampaClient` e aceita um dicionário `options` para customização de parâmetros da instância. Parâmetros aceitos atualmente são:
* ttl: tempo de vida em segundos dos dados em memória até que ele seja expirado e uma nova consulta externa seja feita.

```
var bikesampa = new CachedBikeSampaClient({ttl: 60});
```

No exemplo acima uma nova instância foi criada com um tempo de vida dos dados de um minuto (60 segs).

## Exemplo
```
var CachedBikeSampaClient = require("BikeSampaClient").CachedBikeSampaClient;
var bikesampa = new CachedBikeSampaClient({ttl:60});

bikesampa.getAll(function(err, stations) {
	if(err) {
		// error handling
	} else {
		// success
	}
};)


bikesampa.getStation('143', function(err, station) {
	if(err) {
		// error handling
	} else {
		// success
	}
});
```