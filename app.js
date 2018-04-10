'use strict';

let express = require('express');
let app = express();
let Promise = require('bluebird');
let request = Promise.promisify(require('request'));
const NodeCache = require('node-cache');
const pegelCache = new NodeCache({stdTTL: 60, checkperiod: 180});

const requestString = 'http://www.hvz.lubw.baden-wuerttemberg.de/overview.html';

function getPegel() {
  return new Promise((resolve, reject) => {
    request(requestString)
      .then((response) => {
        const regex = /Wannweil \/ Echaz',.*?,.*?,.*?,'(.*?)'/g;
        var match = regex.exec(response.body)
        let depth = match[1]
        resolve(
          {
            'frames': [
              {
                'text': 'Echaz ' + depth,
                'icon': 'i19772',
                'index': 0,
              },
            ],
          });
      });
  });
};

app.get('/pegel', function (request, response) {
  if (pegelCache.get('pegel')) {
    response.send(pegelCache.get('pegel'));
  }
  else {
    getPegel()
      .then((result) => {
        pegelCache.set('pegel', result);
        response.json(result);
      })
      .catch((error) =>
        response.json(
          {
            'frames': [
              {
                'text': 'Error',
                'icon': 'a6175',
                'index': 0,
              },
            ],
          }));
  }
});

// load local VCAP configuration  and service credentials
let vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log('Loaded local VCAP', vcapLocal);
}
catch (e) {}

let port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('To view your app, open this link in your browser: http://localhost:' + port);
});

