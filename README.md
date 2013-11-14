logrotate-stream
================

A Writable Stream that supports linux logrotate style options

[![Build Status](https://travis-ci.org/dstokes/logrotate-stream.png)](https://travis-ci.org/dstokes/logrotate-stream)  
[![NPM](https://nodei.co/npm/logrotate-stream.png?downloads=true)](https://nodei.co/npm/logrotate-stream/)  

example
=======
On the command line:
``` sh
  node app.js 2>&1 | logrotate-stream app.log --keep 3 --size 1024 --compress
```

As a module:
``` js
var stream = require('logrotate-stream')
  , toLogFile = stream({ file: './test.log', size: 1024, keep: 3 });

someStream.pipe(toLogFile);
```

options
=======

### file
The file log file to write data to.

### keep
The number of rotated log files to keep (including the primary log file). 
Additional logs are deleted no rotation.

### compress
Optionally compress rotated files with gzip.

install
=======

With [npm](http://npmjs.org) do:

```
npm install logrotate-stream
```
