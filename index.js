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
var utils = require('./utils');

module.exports = function(config) {
  return function fn(view) {
    if (!this.isView) return fn;
    if (this.isRegistered('view-fs')) return;

    debug('running fs %s');

    /**
     * Read `file.path` and update `file.contents` with the result.
     *
     * ```js
     * app.view('foo.txt')
     *   .read(function(err, file) {
     *      console.log(file.contents);
     *   });
     * ```
     * @name .read
     * @param {Object} `options` Options to pass to `fs.readFile` and/or define `options.forceRead` to read from the file system, even when `file.contents` is already populated.
     * @param {Function} `cb`
     * @api public
     */

    this.define('read', function(options, cb) {
      debug('reading %s', this.path);
      var file = this;

      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      var opts = file.options;
      if (typeof options !== 'string') {
        opts = utils.extend({}, file.options, options);
      }

      if (!file.path || (file.contents && opts.read !== true)) {
        cb(null, file);
        return;
      }

      fs.stat(file.path, function(err, stats) {
        if (err) return cb(err);

        if (stats.isDirectory()) {
          cb(null, file);
          return;
        }

        // pass original options, not merged (could be a string)
        utils.read(file.path, options, function(err, contents) {
          if (err) return cb(err);
          file.contents = contents;
          cb(null, file);
        });
      });
    });

    /**
     * Asynchronously writes `file.contents` to the given `dest` path on the
     * file system, replacing the file if it already exists.
     *
     * ```js
     * app.view('foo.txt', {content: 'this is content...'})
     *   .write('dist/', function(err, view) {
     *      // writes to `dist/foo.txt`
     *   });
     * ```
     * @name .write
     * @emits write
     * @param {String} `dest` Desination directory
     * @param {Object} `options`
     * @param {Function} `cb`
     * @api public
     */

    this.define('write', function(dest, options, cb) {
      debug('writing %s', this.path);
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

      var opts = utils.extend({}, file.options, options);
      var filePath = file.path;

      file.read(opts, function(err, file) {
        if (err) return cb(err);

        var relative = opts.flatten ? file.basename : file.relative;
        file.dest = path.resolve(dest || file.dest);
        file.path = path.resolve(file.dest, relative);

        // pass original options, not merged (could be a string)
        utils.write(file.path, file.contents.toString(), options, function(err) {
          if (err) return cb(err);
          file.emit('write', file, filePath, file.path);
          cb(null, view);
        });
      });
    });

    /**
     * Asynchronously deletes `file.path` from the file system.
     *
     * ```js
     * app.view('foo.txt', {content: 'this is content...'})
     *   .del(function(err) {
     *     if (err) throw err;
     *   });
     * ```
     * @name .del
     * @emits del
     * @param {Object} `options`
     * @param {Function} `cb`
     * @api public
     */

    this.define('del', function(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      var file = this;
      utils.del(this.path, utils.extend({}, this.options, options), function(err) {
        if (err) return cb(err);
        file.emit('del', file, file.path);
        cb();
      });
    });

    /**
     * Asynchronously writes `file.contents` to the given `dest` directory,
     * and deletes the source file at `file.path`.
     *
     * ```js
     * app.view('foo.txt', {content: 'this is content...'})
     *   .move('dist/', function(err) {
     *     if (err) throw err;
     *     // writes `dist/foo.txt` and deletes `foo.txt`
     *   });
     * ```
     * @name .move
     * @emits move
     * @param {String} `dest` Desination directory
     * @param {Object} `options`
     * @param {Function} `cb`
     * @api public
     */

    this.define('move', function(dest, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }

      var opts = utils.extend({flatten: true}, this.options, options);
      var origPath = this.path;
      var file = this;

      this.write(dest, opts, function() {
        utils.del(origPath, opts, function(err) {
          if (err) return cb(err);
          file.emit('del', file, origPath);
          file.emit('move', file, origPath, file.path);
          cb();
        });
      });
    });
  };
};
