var http = require('http');

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


var fluffy = http.createServer(
  util.req_chain(sanitize, dispatch, force_login)
);
fluffy.listen(Number(env['FLUFFY_HTTP_PORT']));
/*
var fluffys = https.createServer(
  util.req_chain(sanitize, authenticate, dispatch, force_login)
);
fluffy.listen(Number(env['FLUFFY_HTTPS_PORT]));
*/
