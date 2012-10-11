var forbidden_header = function(header) {
  // We reserve the entire "fluffy-" prefix for ourselves
  var prefix = "fluffy-";
  if (header.substring(0, prefix.length) == prefix) {
    return true;
  }

  // We also blacklist some other headers with special meanings
  return ![
    'x-forwarded-for',
    'x-real-ip'
  ].every(function(blacklisted) {
    return header != blacklisted;
  });
};

// Sanitize headers we don't want forwared on.
var sanitize = function(next, req, res) {
  var headers = {};

  for (var prop in req.headers) {
    if (req.headers.hasOwnProperty(prop) && !forbidden_header(prop)) {
      headers[prop] = req.headers[prop];
    }
  }

  Object.freeze(headers);
  req.headers = headers;

  next(req, res);
};

module.exports = sanitize;
