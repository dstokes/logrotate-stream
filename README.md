logrotate-stream
================

A Writable Stream that supports linux logrotate style options

[![Build Status](https://travis-ci.org/dstokes/logrotate-stream.png)](https://travis-ci.org/dstokes/logrotate-stream)
[![Donate](http://img.shields.io/bitcoin/donate.png?color=blue)](https://www.coinbase.com/dstokes)  
[![NPM](https://nodei.co/npm/logrotate-stream.png?downloads=true)](https://nodei.co/npm/logrotate-stream/)  

example
=======
On the command line:
``` sh
  node app.js 2>&1 | logrotate-stream app.log --keep 3 --size '50m' --compress
```

As a module:
``` js
var stream = require('logrotate-stream')
  , toLogFile = stream({ file: './test.log', size: '100k', keep: 3 });

someStream.pipe(toLogFile);
```

the problem
===========
Rotating logs that are being written to with stdio redirection sucks. Using a
utility like `logrotate` doesn't automagically update your processes log file 
descriptor and you end up with several empty logs and one mega rotated log.

There's a couple ways to try and deal with this, but they all fall short:
#### 1. Use `winston`'s log rotation feature for nodejs apps

This requires adding a new dependency and possibly code changes around logging
logic.

#### 2. Restart your app on a process signal

Often times, production apps can't be restarted willy-nilly

#### 3. Use the `copytruncate` feature of `logrotate`

This only works if you don't need to guarantee that all of your log lines are
persisted. `copytruncate` performs a non-atomic copy before truncating the
original log, which means you can lose data in the process if the copy is slow.

`logrotate-stream` tries to remedy this situation by acting as an intermediary
between the application and the file system, piping `stdin` to log files and
rotating those logfiles when necessary.

upstart woes
============
If you find yourself using logrotate-stream with upstart, there's a few things
to consider. Piping to logrotate-stream in your `exec` line will cause upstart
to track the pid of the logrotate process rather than your app. While stopping
will still work (most likely emitting an EPIPE error on your app before
exiting), it would be better if you used a named pipe to redirect your apps output:
```
chdir /path/to/app

pre-start script
  # create a named pipe
  mkfifo logpipe
  # create a backgrounded logrotate-stream process and
  # redirect the named pipe data to it
  logrotate-stream app.log --keep 3 --size 50m < logpipe &
end script

# start the app, redirecting stdout & stderr to the named pipe
exec /usr/local/bin/node index.js > logpipe 2>&1
```

This setup will register the correct pid with upstart, make sure your stdio
is forwarded to logrotate-stream, and will properly kill the logrotate-stream
process when your app is stopped.

options
=======

### file
The file log file to write data to.

### size
The max file size of a log before rotation occurs. Supports `1024`, `1k`, `1m`, `1g`

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
