var http = require('http');

var util = require('lib/util');

// Handlers
var sanitize = require('lib/sanitize');
var authenticate = require('lib/authenticate');
var dispatch = require('lib/dispatch');
var force_login = require('lib/force_login');


var fluffy = http.createServer(
  util.req_chain(sanitize, dispatch, force_login)
);
fluffy.listen(8001);
/*
var fluffys = https.createServer(
  util.req_chain(sanitize, authenticate, dispatch, force_login)
);
fluffy.listen(443);
*/
