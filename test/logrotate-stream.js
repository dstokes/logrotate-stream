var fs = require('fs')
  , test = require('tape')
  , logRotate = require('../');

test('rotates based on file size option', function(t) {
  var file = __dirname+"/test.log" +Date.now();
  var s = logRotate({ file: file, size: 600 });

  var bytes = 0;
  var done = 100;
  var files = [];

  s.on('finish',function() {
    t.equals(files.length, 2, 'should have 2 files');
    // TODO clean up files
    t.end();
  })

  s.on('rotated', function(file) {
    files.push(file);
  });

  var data;
  data = setInterval(function() {
    var chunk = Date.now() +"\n";// 14 bytes
    s.write(chunk);
    bytes += chunk.length;

    if (!--done) {
      clearInterval(data);
      s.end();
    }
  }, 1);
});
