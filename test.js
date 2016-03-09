
'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var del = require('delete');
var read = require('read-file');
var App = require('templates');
var plugin = require('./');
var app;

function exists(fp, expected, cb) {
  fs.stat(fp, function(err, stats) {
    if (err) return cb(err);

    read(fp, 'utf8', function(err, actual) {
      if (err) return cb(err);
      if (expected !== actual) {
        cb(err);
      } else {
        cb();
      }
    });
  });
}

describe('view.fs', function() {
  beforeEach(function() {
    app = new App();
    app.use(plugin());
    app.create('pages');
  });

  afterEach(function(cb) {
    del('actual', cb);
  });

  describe('plugin', function(cb) {
    it('should decorate methods onto app.view', function() {
      var view = app.view('fixtures/a.txt');
      assert.equal(typeof view.read, 'function');
      assert.equal(typeof view.write, 'function');
      assert.equal(typeof view.move, 'function');
    });

    it('should decorate methods onto collection.view', function() {
      var view = app.pages.addView('fixtures/a.txt');
      assert.equal(typeof view.read, 'function');
      assert.equal(typeof view.write, 'function');
      assert.equal(typeof view.move, 'function');
    });
  });

  describe('app.view', function(cb) {
    it('should set file.contents from file.path', function(cb) {
      var view = app.view('fixtures/a.txt')
        .read(function(err, file) {
          assert.equal(file.content, 'aaa');
          cb();
        });
    });
  });

  describe('view.read', function(cb) {
    it('should set file.contents from file.path', function(cb) {
      app.pages.addView('fixtures/a.txt')
        .read(function(err, file) {
          assert.equal(file.content, 'aaa');
          cb();
        });

    });

    it('should not read from file.path when file.contents exists', function(cb) {
      app.pages.addView('fixtures/a.txt', { content: 'this is foo' })
        .read(function(err, view) {
          if (err) return cb(err);
          assert.equal(view.content, 'this is foo');
          cb();
        });
    });

    it('should force-read from file.path when `options.read` is defined', function(cb) {
      app.pages.addView('fixtures/a.txt', { content: 'this is foo' })
        .read({read: true}, function(err, view) {
          if (err) return cb(err);
          assert.equal(view.content, 'aaa');
          cb();
        });
    });
  });

  describe('view.write', function(cb) {
    it('should write file.contents to the path passed to file.write', function(cb) {
      var view = app.pages.addView('foo.txt', { content: 'this is foo' });

      view.write('actual', function(err) {
        if (err) return cb(err);
        exists('actual/foo.txt', view.content, cb);
      });
    });

    it('should write file.contents to file.dest', function(cb) {
      var view = app.pages.addView('foo.txt', { content: 'this is foo', dest: 'actual' });
      view.write(function(err) {
        if (err) return cb(err);
        exists('actual/foo.txt', view.content, cb);
      });
    });

    it('should use updated file.basename', function(cb) {
      var view = app.pages.addView('foo', { content: 'this is foo' });

      view.basename = 'whatever.js';
      view.write('actual', function(err) {
        if (err) return cb(err);
        exists('actual/whatever.js', view.content, cb);
      });
    });

    it('should use updated file.extname', function(cb) {
      var view = app.pages.addView('foo', { content: 'this is foo' });

      view.basename = 'whatever';
      view.extname = '.js';

      view.write('actual', function(err) {
        if (err) return cb(err);
        exists('actual/whatever.js', view.content, cb);
      });
    });

    it('should use updated file.dirname', function(cb) {
      var view = app.pages.addView('foo.txt', { content: 'this is foo' });

      view.dirname = 'abc';
      view.basename = 'whatever';
      view.extname = '.js';

      view.write('actual', function(err) {
        if (err) return cb(err);
        exists('actual/abc/whatever.js', view.content, cb);
      });
    });
  });
});
