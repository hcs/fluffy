// Dispatch a request to a helpfully named UNIX domain socket
var dispatch = function(next, req, res) {
  next(req, res);
};

module.exports = dispatch;
