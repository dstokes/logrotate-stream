var test = require('tape');
var fs = require('fs')
var logRotate = require('../');

var b = '';

test('can fu',function(t){

  var file = __dirname+"/test.log"+Date.now();

  var s = logRotate({file:file,size:600});

  var bytes = 0;
  var done = 100;
  var files = [];

  s.on('finish',function(){
    t.equals(files.length,2,'should have 2 files');
    // TODO clean up files
    t.end();
  })

  s.on('rotated',function(file){
    files.push(file);
  });

  var data;
  data = setInterval(function(){
    b += Date.now()+"\n";// 14 bytes
    s.write(b)
    bytes += b.length;

    if(!--done) {
      clearInterval(data);
      s.end();
    }
  },1);
});


