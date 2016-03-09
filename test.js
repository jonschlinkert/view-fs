
'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var del = require('delete');
var App = require('templates');
var plugin = require('./');
var app;

describe('view.fs', function() {
  beforeEach(function() {
    app = new App();
    app.use(plugin());
    app.create('pages');
  });

  afterEach(function(cb) {
    del('actual', cb);
  });

  it('should work with views added with other methods', function(cb) {
    app.pages.addView('foo', {content: 'this is foo'})
      .read(function(err, view) {
        if (err) return cb(err);
        view.basename = 'whatever.js';
        view.write('actual', cb);
      });
  });
});
