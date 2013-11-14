var fs = require('fs')
  , test = require('tape')
  , path = require('path')
  , logRotate = require('../');

function fileName() { return __dirname +"/test.log_"+ Date.now(); }
function writes(s, ct) {
  var done = ct || 100
    , inv;

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

  s.on('finish', function() {
    t.equals(files.length, 2, 'should have 2 files');
    // TODO clean up files
    t.end();
  })

  s.on('rotated', function(file) {
    files.push(file);
  });

  // start writing
  writes(s, 100);
});

test('keeps the appropriate number of rotated logs', function(t) {
  var file = fileName()
    , s = logRotate({ file: file, size: 600, keep: 5 });

  s.on('finish', function() {
    console.log('finished');
    fs.readdir(__dirname, function(err, files) {
      var kept = 0;
      for (var i = 0, l = files.length; i < l; i++) {
        if (files[i].indexOf(path.basename(file)) !== -1) kept++;
      }

      t.equals(kept, 5, 'should keep 5 files');
      // TODO clean up files
      t.end();
    });
  })

  // start writing
  writes(s, 200);
});
