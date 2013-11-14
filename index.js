var fs = require('fs')
  , util = require('util')
  , rotate = require('log-rotate')
  , Writable = require('stream').Writable;

module.exports = LogStream;

util.inherits(LogStream, Writable);

function LogStream(options) {
  if (! (this instanceof LogStream)) { return new LogStream(options); }
  Writable.call(this, options);

  this.file = options.file;
  this.size = (options.size || 51200000000 /* 50MB */);
  this.rotateOptions = {
    count: (options.keep || 3),
    compress: (options.compress || false)
  };

  this._createWriteStream();
}

LogStream.prototype._createWriteStream = function() {
  var self = this;
  this.writer = fs.createWriteStream(this.file, { flags: 'a+' });

  this.writer.once('open', function() {
    fs.stat(self.file, function(err, st) {
      if (err) return self.emit('error', err);
      self.writer.size = st.size;
      self.emit('ready', self.writer);
    });
  });
}

LogStream.prototype._write = function(chunk, encoding, cb) {
  var rotate = this.writer.size > this.size;
  if (rotate || typeof this.writer.size === 'undefined') {
    if (rotate) this._rotate()
    return this.once('ready', function() {
      this.writer.write(chunk, encoding)
      this.writer.size += chunk.length;
      cb();
    });
  }

  this.writer.write(chunk, encoding)
  this.writer.size += chunk.length;
  cb();
}

LogStream.prototype._rotate = function() {
  var self = this;
  // destroy the current log stream
  this.writer.end();

  rotate(this.file, this.rotateOptions, function(err) {
    if (err) return self.emit('error', err);
    self.emit('rotated', rotated);
    self._createWriteStream();
  });
}
