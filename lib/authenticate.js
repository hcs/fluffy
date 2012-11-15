var authenticate = function(next, req, res) {
  // If the connection isn't encrypted, don't even bother
  if (!req.connection.encrypted) {
    return next(req, res);
  }

  // Chain the verification functions together. It's in reverse order, so we try
  // SSL peer certificates, API keys, and CAS tokens in that order.
  var cas = verify_cas_token.bind(null, next, next);
  var api = verify_api_key.bind(null, next, cas);
  var peer = verify_peer.bind(null, next, api);

  return peer(req, res);
};

// Verfiy a peer certificate. We assume the CA certificate is a trusted signer,
// and that the SSL implementation rejects certificates not signed by that CA.
// We do no verification of the signer of our own.
var verify_peer = function(cb, next, req, res) {
  if (req.connection.authorized) {
    var peer = req.connection.getPeerCertificate();
    req.headers['fluffy-user'] = peer.subject.CN;
    req.headers['fluffy-auth-method'] = 'certificate';

    return cb(req, res);
  }

  return next(req, res);
};

// Verify an API key. We just need to look up the API key in some database
// somewhere.
var verify_api_key = function(cb, next, req, res) {
  // XXX: this is an awful hack and should die a terrible, terrible death.
  var hacky_testing_hardcoded_user_map = {
    'mynameiscarl': 'carl@hcs.harvard.edu',
    'testingkey': 'testing@hcs.harvard.edu'
  };

  // We use HTTP Basic authentication to support API keys. The API key should be
  // stored in the username field, and the password should be blank.
  if ('authorization' in req.headers) {
    // The 'Authorization' header contains the string "Basic", a space, followed
    // by a base64 encoded version of the string "username:password". Let's go
    // parse that out.
    var auth64 = req.headers['authorization'];
    if (auth64.substr(0, 6).toLowerCase() != 'basic ') {
      return next(req, res);
    }

    var auth = new Buffer(auth64.substr(6), 'base64').toString('ascii');
    if (auth.indexOf(':') != auth.length - 1) {
      return next(req, res);
    }

    var api_key = auth.substring(0, auth.length - 1);

    // TODO: This should be some sort of database lookup.
    if (api_key in hacky_testing_hardcoded_user_map) {
      req.headers['fluffy-user'] = hacky_testing_hardcoded_user_map[api_key];
      req.headers['fluffy-auth-method'] = 'apikey';

      return cb(req, res);
    }
  }

  return next(req, res);
};

// Verify a CAS token, if one is present, by making a request to the CAS server.
var verify_cas_token = function(cb, next, req, res) {
  // TODO: write this.
  return next(req, res);
};

module.exports = authenticate;
