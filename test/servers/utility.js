/* global describe, it */
'use strict';
var assert = require('assert');
var utility = require('../../servers/utility');


describe('utility', function() {
	describe('#cacheEntry()', function() {
		it('should stringify the json and create a timestamp in the cachEntry', function() {
			var cacheEntry = utility.cacheEntry('TEST', 'http://www.google.com', {'some':'object', 'data': 123});
			var parsedEntry = JSON.parse(cacheEntry);
			assert.notEqual(parsedEntry.timestamp, undefined);
			assert(!isNaN(Date.parse(parsedEntry.timestamp)), 'Invalid date format');
		});

		it('should stringify the json and store the status', function() {
			var cacheEntry = utility.cacheEntry('TEST', 'http://www.google.com', {'some':'object', 'data': 123});
			var parsedEntry = JSON.parse(cacheEntry);
			assert.strictEqual(parsedEntry.status, 'TEST');
		});

		it('should stringify the json and store the url', function() {
			var cacheEntry = utility.cacheEntry('TEST', 'http://www.google.com', {'some':'object', 'data': 123});
			var parsedEntry = JSON.parse(cacheEntry);
			assert.strictEqual(parsedEntry.url, 'http://www.google.com');
		});
	});
});
