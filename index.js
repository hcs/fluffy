var http = require('http');
var https = require('https');
var fs = require('fs');

// Fluffy is configured via environment variables. Let's set some defaults,
// which will be especially default when developing.
var env = process.env;
env['FLUFFY_HTTP_PORT'] = env['FLUFFY_HTTP_PORT'] || '8001';
env['FLUFFY_HTTPS_PORT'] = env['FLUFFY_HTTPS_PORT'] || '8002';

var util = require('./lib/util');

// Handlers
var sanitize = require('./lib/sanitize');
var authenticate = require('./lib/authenticate');
var dispatch = require('./lib/dispatch');
var force_login = require('./lib/force_login');

//var fluffy = http.createServer(
  //util.req_chain(sanitize, authenticate, dispatch, force_login)
//);
//fluffy.listen(Number(env['FLUFFY_HTTP_PORT']));

var options = {
  /* Fluffy's key and certificate */
  key: fs.readFileSync('./fixtures/ssl-server/server.key'),
  cert: fs.readFileSync('./fixtures/ssl-server/server.crt'),
  passphrase: 'password',

  /* This cert will be located in /etc/certs/ and will be accessible to all hcs
    machines */
  ca: fs.readFileSync('./fixtures/ca/ca.crt'),
  requestCert: true,
}

var fluffy = https.createServer(
  options,
  util.req_chain(sanitize, authenticate, dispatch, force_login)
);

fluffy.listen(Number(env['FLUFFY_HTTPS_PORT']));
