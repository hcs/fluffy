// If authentication takes a while, it's possible that a 'data' event will get
// dropped on the floor since there are no listeners for it. To get around that,
// we keep an array of events we've received, which we play back when
// stream.flush() gets called.
var buffered_stream = function(stream) {
  var event_stream = [];

  var callback = function() {
    event_stream.push(Array.prototype.slice.call(arguments));
  };
  var callbacks = ['data', 'end', 'error', 'close'].map(function(event) {
    var cb = callback.bind(null, event);
    stream.on(event, cb);
    return stream.removeListener.bind(stream, event, cb);
  });

  stream.flush = function() {
    callbacks.forEach(function(remove_callback) { remove_callback(); });

    for (var i = 0; i < event_stream.length; i++) {
      stream.emit.apply(stream, event_stream[i]);
    }

    // This stream might be around for a while, and this flush() function closes
    // over event_steam, so that memory won't get garbage collected unless we do
    // something about it ourselves.
    event_stream.splice(0, event_stream.length);
  };
};

module.exports = buffered_stream;
