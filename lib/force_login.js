// Force a user to log in
var force_login = function(next, req, res) {
  next(req, res);
};

module.exports = force_login;
