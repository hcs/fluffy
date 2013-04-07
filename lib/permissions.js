/* At this point in the chain, our user has been authenticated. Now we must
 * check that user has necessary permissions to execute desired service */
function verify_permissions(next, req, res) {

  // how do we even do this?
  next(req,res);
}

module.exports = verify_permissions;
