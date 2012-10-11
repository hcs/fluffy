var http = require('http');
var domain = require('domain');
var url = require('url');

var forbidden_header = function(string) {
  // We reserve the entire "fluffy-" prefix for ourselves
  var prefix = "fluffy-";
  if (string.substring(0, prefix.length) == prefix) {
    return true;
  }

  // We also blacklist some other headers with special meanings
  return ![
    'x-forwarded-for',
    'x-real-ip'
  ].every(function(blacklisted) {
    return string != blacklisted;
  });
};

// Sanitize headers we don't want forwared on.
var sanitize = function(next, req, res) {
  console.log(req.headers);
  var headers = {};

  for (var prop in req.headers) {
    console.log(prop);
    if (req.headers.hasOwnProperty(prop) && !forbidden_header(prop)) {
      headers[prop] = req.headers[prop];
    }
  }

  Object.freeze(headers);
  req.headers = headers;

  next(req, res);
};

var authenticate = function(next, req, res) {
  next(req, res);
};

var dispatch = function(next, req, res) {
  next(req, res);
};

var force_login = function(next, req, res) {
  next(req, res);
};

// Utility function for closure-converting a chain of request processors
var req_chain = function() {
  var handler = function() {
    throw new Error('Unknown routing error');
  };
  for (var i = arguments.length - 1; i >= 0; i--) {
    handler = (function(fn, handler) {
      return fn.bind(null, handler);
    })(arguments[i], handler);
  }
  return function(req, res) {
    // Error domain for this request. This greatly simplifies asynchronous error
    // handling and ensuring we always send a response.
    var d = domain.create();
    d.on('error', function(e) {
      // TODO: this should probably email someone or something
      console.log(e.stack);
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        'error': e.message
      }, undefined, 2) + '\n');
    });

    return d.run(function() {
      handler(req, res);
    });
  };
};

var fluffy = http.createServer(
  req_chain(sanitize, dispatch, force_login)
);
fluffy.listen(8001);
/*
var fluffys = https.createServer(
  req_chain(sanitize, authenticate, dispatch, force_login)
);
fluffy.listen(443);
*/
