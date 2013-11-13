logrotate-stream
================

A Writable Stream that supports linux logrotate style options

[![NPM](https://nodei.co/npm/logrotate-stream.png?downloads=true)](https://nodei.co/npm/logrotate-stream/)  

example
=======
``` js
var LogStream = require('logrotate-stream')
  , toLogFile = LogStream({ file: './test.log', keep: 3 });

someLogStream.pipe(toLogFile);
```

options
=======

### file
The file to write data to

### keep
The number of log files to keep

### compress
Optionally compress rotated files

install
=======

With [npm](http://npmjs.org) do:

```
npm install logrotate-stream
```
