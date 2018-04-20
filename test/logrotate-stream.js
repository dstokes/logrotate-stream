var fs = require('fs')
  , test = require('tape')
  , path = require('path')
  , logRotate = require('../');

function fileName() { return __dirname +"/test.log_"+ Math.random(); }
function getFiles(name, cb) {
  fs.readdir(__dirname,  function(err, files) {
    if (err) return cb(err);
    cb(null, files.filter(function(file) {
      return file.indexOf(path.basename(name)) !== -1;
    }));
  });
}
function cleanup(name) {
  getFiles(name, function(err, files) {
    while (files.length)
      try { fs.unlinkSync(__dirname +"/"+ files.shift()); } catch (e) {}
  });
}

function getSizes(name, cb) {
  var sizes = []
    , ct = 0;
  function done(err) { if (! --ct) cb(err, sizes); }

  getFiles(name, function(err, files) {
    ct = files.length;
    files.forEach(function(file) {
      fs.stat(__dirname +'/'+ file, function(err, st) {
        sizes.push(st.size);
        done(err);
      });
    });
  });
}

function writes(s, ct, cb) {
  var done = ct || 100
    , inv;

  if (cb) { s.on('finish', cb); }

  inv = setInterval(function() {
    var chunk = Date.now() + "\n"; // 14 bytes
    s.write(chunk);
    if (! --done) {
      clearInterval(inv);
      s.end();
    }
  }, 1);
}

test('rotates based on file size option', function(t) {
  var files = []
    , file = fileName();

  var s = logRotate({ file: file, size: 600 });

  s.on('rotated', function(file) {
    files.push(file);
  });

  // start writing
  writes(s, 100, function() {
    setImmediate(function () {
      t.equals(files.length, 2, 'should have 2 files');
      cleanup(file);
      t.end();
    });
  });
});

test('properly parses size units', function(t) {
  var values = { '1024': 1024, '1k': 1024, '2k': 2048, '1MB': 1048576, '1g': 1073741824 };
  Object.keys(values).forEach(function(k) {
    var file = fileName()
      , s = logRotate({ file: file, size: k });
    s.on('ready', function() { cleanup(file); });
    t.equals(s.size, values[k], 'should parse '+ k +' to '+ values[k]);
  });
  t.end();
});

test('writes the correct number of bytes', function(t) {
  var bytes = 0
    , file = fileName();

  var s = logRotate({ file: file, keep: 4, size: 400 });

  // start writing
  writes(s, 100, function() {
    getSizes(file, function(err, sizes) {
      var bytes = 0;
      while (sizes.length) bytes += sizes.shift();
      t.equals(bytes, 100*14, 'should have 4 files');
      cleanup(file);
      t.end();
    });
  });
});

test('supports object mode writes', function(t) {
  var file = fileName();
  var s = logRotate({ file: file, keep: 4, size: 400, objectMode: true });

  function done(err) {
    if (err) t.fail('failed to support object mode');
    else t.pass('supports object mode');
    cleanup(file);
    t.end();
  }

  s.on('error', done);
  s.on('finish', done);
  s.write({'msg': 'ohai'});
  s.end();
});

test('keeps the appropriate number of rotated logs', function(t) {
  var file = fileName()
    , s = logRotate({ file: file, size: 600, keep: 5 });

  // start writing
  writes(s, 200, function() {
    getFiles(file, function(err, files) {
      t.equals(files.length, 5, 'should keep 5 files');
      cleanup(file);
      t.end();
    });
  });
});

test('chunks large buffers', function(t) {
  var file = fileName();
  var s = logRotate({ file: file, keep: 32, size: '1k' });

  s.on('finish', function() {
    getSizes(file, function(err, sizes) {
      var bytes = 0, files = 0;
      while (sizes.length) {
        files++;
        bytes += sizes.shift();
      }

      t.equals(files, 32, 'should write 32 files');
      t.equals(bytes, total_bytes, 'should write '+ total_bytes +' bytes');
      cleanup(file);
      t.end();
    });
  });

  var data = '';
  for (var i = 0, l = 64; i < l; i++) {
    data += new Array(512).join('1') + '\n';
  }
  var total_bytes = data.length;
  s.write(data);
  s.end();
});

test('writes remaining data on finish', function(t) {
  var file = fileName();
  var s = logRotate({ file: file, keep: 1, size: '1k' });

  s.writer.on('finish', function() {
    getSizes(file, function(err, sizes) {
      t.equals(1, sizes.length, 'should write 1 file');
      t.equals(14, sizes[0], 'should write 14 bytes');
      cleanup(file);
      t.end();
    });
  });

  s.write("foo\nbar");
  s.end("foo\nbar");
});
