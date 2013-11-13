var fs = require('fs')
  , util = require('util')
  , rotate = require('log-rotate')
  , Writable = require('stream').Writable;

module.exports = LogStream;

util.inherits(LogStream, Writable);

function LogStream(options) {
  if (! (this instanceof LogStream)) { return new LogStream(options); }
  Writable.call(this, options);

  var self = this;
  this.file = options.file;
  this.size = (options.size || 200);
  this.keep = (options.keep || 3);
  this.compress = (options.compress || false);

  this._openWriteStream();
}

LogStream.prototype._openWriteStream = function() {
  var self = this;
  this.log = fs.createWriteStream(this.file, { flags: 'a+' });

  this.log.once('open', function() {
    fs.stat(self.file, function(err, st) {
      // set the file size to 0 if stat fails
      self.log.size = err ? 0 : st.size;
      self.emit('ready', self.log);
    });
  });
}

LogStream.prototype.queue = function(chunk, encoding) {
  if(this.log.destroyed !== true) {
    this.log.write(chunk, encoding);
    this.log.size += chunk.length;
  } else {
    this.once('ready', function(log) {
      log.write(chunk, encoding);
      log.size += chunk.length;
    });
  }
}

LogStream.prototype._write = function(chunk, encoding, cb) {
  // rotate if the log file has grown too large
  if(this.log.size > this.size) {
    this._rotate();
  }

  this.queue(chunk, encoding);
  cb()
}

LogStream.prototype._rotate = function() {
  var self = this
    , options = { count: this.keep, compress: this.compress };

  // destroy the current log stream
  this.log.removeAllListeners();
  this.log.destroy();

  rotate(this.file, options, function(err) { self._openWriteStream(); });
}
