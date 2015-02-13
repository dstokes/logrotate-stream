var fs = require('fs')
  , byt = require('byt')
  , util = require('util')
  , rotate = require('log-rotate')
  , Writable = require('stream').Writable;

module.exports = LogStream;

util.inherits(LogStream, Writable);

function LogStream(options) {
  if (! (this instanceof LogStream)) { return new LogStream(options); }
  Writable.call(this, options);

  if (typeof options.objectMode !== 'undefined') {
    this._writableState.objectMode = !!options.objectMode;
  }

  this.last = '';
  this.file = options.file;
  this.size = (byt(options.size) || byt('50m'));
  this.rotateOptions = {
    count: (options.keep || 3),
    compress: (options.compress || false)
  };
  this._createWriteStream();

  // cleanup underlying writer
  this.on('finish', function() {
    if (this.writer) this.writer.end(this.last || null);
  });
}

LogStream.prototype._createWriteStream = function() {
  var self = this;
  this.writer = fs.createWriteStream(this.file, { flags: 'a+' });
  this.writer.on('error', function(err) { self.emit('error', err); });

  this.writer.once('open', function() {
    fs.stat(self.file, function(err, st) {
      if (err) return self.emit('error', err);
      self.writer.size = st.size;
      self.emit('ready', self.writer);
    });
  });
}

LogStream.prototype._write = function(chunk, encoding, cb) {
  var self = this
    , lines = (this.last + chunk).split("\n");
  this.last = lines.pop()

  function next() {
    if (lines.length === 0) return cb();
    var line = lines.shift() +"\n";
    if (self.writer.size + line.length > self.size) {
      self._rotate();
      self.once('ready', function() {
        self.writer.size += line.length;
        self.writer.write(line, next);
      });
    } else {
      self.writer.size += line.length;
      self.writer.write(line, next);
    }
  }

  if (typeof this.writer.size === 'undefined') {
    this.once('ready', next);
  } else {
    next();
  }
}

LogStream.prototype._rotate = function() {
  var self = this;
  // destroy the current log stream
  this.writer.end();

  rotate(this.file, this.rotateOptions, function(err, rotated) {
    if (err) return self.emit('error', err);
    self.emit('rotated', rotated);
    self._createWriteStream();
  });
}
