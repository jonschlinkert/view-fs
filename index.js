/*!
 * view-fs (https://github.com/jonschlinkert/view-fs)
 *
 * Copyright (c) 2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var fs = require('fs');
var path = require('path');
var debug = require('debug')('fs');
var extend = require('extend-shallow');
var read = require('read-file');
var write = require('write');
var del = require('delete');

module.exports = function(config) {
  return function fn(view) {
    if (!this.isView) return fn;
    if (this.isRegistered('view-fs')) return;

    debug('running fs %s');

    this.define('read', function(options, cb) {
      debug('reading %s', this.path);
      var file = this;

      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      var opts = extend({}, file.options, options);
      if (!file.path || (file.contents && opts.forceRead !== true)) {
        cb(null, file);
        return;
      }

      fs.stat(file.path, function(err, stats) {
        if (err) return cb(err);

        if (stats.isDirectory()) {
          cb(null, view);
          return;
        }

        read(file.path, opts, function(err, contents) {
          if (err) return cb(err);
          file.contents = contents;
          cb(null, view);
        });
      });
    });

    this.define('write', function(dest, options, cb) {
      debug('writing %s', file.path);
      var file = this;

      if (typeof dest === 'function') {
        cb = dest;
        options = {};
        dest = null;
      }
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      var opts = extend({}, file.options, options);
      var filepath = file.path;

      file.read(opts, function(err, file) {
        if (err) return cb(err);

        file.dest = dest || file.dest;
        var destPath = path.resolve(file.dest, file.basename);

        write(destPath, file.contents.toString(), function(err) {
          if (err) return cb(err);

          if (opts.move) {
            file.del(filepath, cb);
          } else {
            cb(null, view);
          }
        });
      });
    });

    this.define('del', function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      var opts = extend({}, this.options, options);
      var file = this;

      fs.exists(file.path, function(exists) {
        if (!exists) return cb();
        del(file.path, opts, cb);
      });
    });

    this.define('move', function(dest, cb) {
      this.write(dest, { move: true }, cb);
    });
  };
};
