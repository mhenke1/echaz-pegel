'use strict';

let express = require('express');
let app = express();
let Promise = require('bluebird');
let request = Promise.promisify(require('request'));
const NodeCache = require('node-cache');
const pegelCache = new NodeCache({stdTTL: 60, checkperiod: 180});

const requestString = 'https://www.hvz.baden-wuerttemberg.de/js/hvz-data-peg-db.js';

function inrange(value, min, max) {
  if (value >= min && value <= max){
    return true;
  }
  return false;
}

function selectIcon(depth) {
  let depthInt = parseInt(depth);
  if (inrange(depth,0,30)) {
    return "24114"
  }
  if (inrange(depth,31,60)) {
    return "24115"
  }
  if (inrange(depth,61,100)) {
    return "24116"
  }
  if (inrange(depth,101,130)) {
    return "24117"
  }
  if (inrange(depth,131,150)) {
    return "24118"
  }
  if (inrange(depth,151,200)) {
    return "24119"
  }
  if (inrange(depth,201,400)) {
    return "24120"
  }
}

function getPegel() {
  return new Promise((resolve, reject) => {
    request(requestString)
      .then((response) => {
        const regex = /Echaz\',.*?,'(.*?)'/gm;
        let match = regex.exec(response.body);
        let depth = match[1];
        resolve(
          {
            'frames': [
              {
                'text': 'Echaz ' + depth,
                'icon': 'i'+ selectIcon(depth),
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

