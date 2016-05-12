'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils;

/**
 * Lazily required module dependencies
 */

require('delete', 'del');
require('extend-shallow', 'extend');
require('read-file', 'read');
require('write');
require = fn;

/**
 * Expose `utils` modules
 */

module.exports = utils;
