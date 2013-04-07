var domain = require('domain');
var buffered_stream = require('../lib/bufferedstream');

// Utility function for closure-converting a chain of request processors
var req_chain = exports.req_chain = function() {
  // The handler of last resort
  var handler = function() {
    throw new Error('Unknown routing error');
  };

  /* Each function passed into req_chain executes and calls the next one. */
  for (var i = arguments.length - 1; i >= 0; i--) {
    handler = (function(fn, handler) {
      return fn.bind(null, handler);
    })(arguments[i], handler);
  }

  /* this is the handler function that gets called when we recieve a request */
  return function(req, res) {
    /* Error domain for this request. This greatly simplifies asynchronous error
     * handling and ensuring we always send a response. */
    var d = domain.create();

    /* If any event emitters or callbacks registerd to a domain emit error we
     * execute following code. */
    d.on('error', function(e) {
      // TODO: this should probably email someone or something
      console.log(e.stack);
      res.writeHead(500, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({
        'error': e.message
      }, undefined, 2) + '\n');
      d.dispose();
    });

    /* if any of these emit 'error', our domain error catching is executing */
    return d.run(function() {
      buffered_stream(req);
      handler(req, res);
    });
  };
};
