var domain = require('domain');

// Utility function for closure-converting a chain of request processors
var req_chain = exports.req_chain = function() {
  // The handler of last resort
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
      d.dispose();
    });

    return d.run(function() {
      handler(req, res);
    });
  };
};
