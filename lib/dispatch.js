var fs = require('fs');
var http = require('http');
var path = require('path');
var url = require('url');

var root = process.env['FLUFFY_DISPATCH_ROOT'] || './services';

// Find a helpfully named UNIX domain socket to dispatch to
var find_socket = function(next, req, res) {
  // Parse out the URL from the request and normalize it (which takes care of
  // the nasty '..' case for us)
  var req_url = path.normalize(url.parse(req.url).pathname);

  // The goal here is to consume as much of the URL in the directory tree as
  // possible. Eventually, we'll get to a socket, at which point we request the
  // remainder of the path from a server connected to that socket.
  var parts = req_url.split('/');
  var current_dir = root;
  var current_path = '/';

  // Maybe I should just use a promises library...
  /* Using the request url, traverse down the directory path until we find a
   * socket. Once we've found a socket, we pass the rest of the request url as
   * 'pathname' into our dispatch function */
  var continuation = function(err, stats) {
    //console.log("Current dir: " + current_dir);
    //console.log("current path: " + current_path);
    if (!err && stats.isDirectory() && parts.length > 0) {
      var part = parts.shift();
      current_dir = path.join(current_dir, part);
      current_path = path.join(current_path, part);
      fs.stat(current_dir, continuation);
    } else if (!err && stats.isSocket()) {
      dispatch(next, req, res, current_dir, current_path, '/' + parts.join('/'));
    } else {
      //console.log('Path is not socket or directory: ' + current_dir);
      throw new Error('Unknown URL');
    }
  };

  fs.stat(current_dir, continuation);
};

// Actually go ahead and make the request
var dispatch = function(next, req, res, socket, prefix, pathname) {
  var headers = JSON.parse(JSON.stringify(req.headers)); // cloning hax.
  sanitize_headers(headers);
  var url_info = url.parse(req.url);
  var proxy = http.request({
    'socketPath': socket,
    'method': req.method,
    'path': pathname + url_info.search,
    'headers': headers
  }, function(proxy_res) {
    sanitize_return_headers(proxy_res.headers);

    switch (proxy_res.statusCode) {
      // On a redirect, we need to rewrite URLs to include the socket's prefix
      case 301: // Moved Permanently
      case 302: // Found
      case 303: // See Other
      case 305: // Use Proxy
      case 307: // Temporary Redirect
      case 308: // Permanent Redirect (experimental RFC)
        if ('location' in proxy_res.headers) {
          var parsed_url = url.parse(proxy_res.headers['location']);
          parsed_url.protocol = url_info.protocol;
          parsed_url.host = url_info.host;
          parsed_url.pathname = prefix + parsed_url.pathname;
          proxy_res.headers['location'] = url.format(parsed_url);
        }
        break;

      // If the client is not authorized, something went wrong with the
      // authentication stack. Call the next handler, which (hopefully) will be
      // able to recover gracefully.
      case 401: // Unauthorized
      case 407: // Proxy Authentication Required
        return next(req, res);

      // All other status codes we should be able to proxy through to the
      // client.
      // TODO: should we rewrite error code responses to have "stock" bodies?
    }

    res.writeHead(proxy_res.statusCode, proxy_res.headers);
    proxy_res.pipe(res);
  });

  proxy.on('error', function(e) {
    throw e;
  });

  req.pipe(proxy);
  req.flush();

  // TODO: we should put a timeout on this proxied request and return 504
};

// Strip out some headers at the last minute. We're trying to prevent a
// compromise in one backend service from, for instance, stealing API keys or
// cookies.
var sanitize_headers = function(headers) {
  delete headers['authorization'];
  delete headers['cookie'];
};
var sanitize_return_headers = function(headers) {
  delete headers['set-cookie'];
}

module.exports = find_socket;
