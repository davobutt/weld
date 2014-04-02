/* global describe, it, beforeEach */
'use strict';

var assert = require('assert');
var redisBackedCacheProvider = require('../../servers/redisBacked');
var CacheJsonMiddleware = require('../../servers/cacheJson').CacheJsonMiddleware;
var EventEmitter = require('events').EventEmitter;

var pushCalled = false;
var writeCalled = false;
var endCalled = false;
var pushToCacheCalled = false;

var mockServer = new EventEmitter();
mockServer.token = 'TestServer';
mockServer.pushToCache = function(cacheEntry) {
    pushToCacheCalled = cacheEntry;
};

var mockCacheProvider = {
    pushToCache : function(key, entry, callback) {
        pushCalled = {key: key, entry:entry};
        callback();
    },
    buildKey : function(token) {
        return 'TEST+' + token;
    }
};

var mockResponse = {
    write: function() {
        writeCalled = true;
    },
    end: function() {
        endCalled = true;
    },
    getHeader: function() {
        return '';
    }
};
var mockRequest = {
    headers: []
};

describe('CacheJsonMiddleware', function() {
    beforeEach(function() {
        pushCalled = false;
        writeCalled = false;
        endCalled = false;
        pushToCacheCalled = false;
    });

    describe('#CacheJsonMiddleware()', function() {
        it('should register event listeners');
        it('should use custom cacheProvider or redis if not supplied', function() {
            var unit = new CacheJsonMiddleware({on: function(){}});
            assert.deepEqual(unit.cacheProvider, redisBackedCacheProvider );
            var customCacheProvider = {'iam':'custom'};
            unit = new CacheJsonMiddleware({on: function(){}}, customCacheProvider);
            assert.deepEqual(unit.cacheProvider, customCacheProvider);
        });
    });

    describe('#handleReset()', function(){
        it('should push reset event to cache', function() {
            var server = new EventEmitter();
            server.token = 'TestServer';

            var unit = new CacheJsonMiddleware(server, mockCacheProvider);
            unit.handleReset();
            assert.notEqual(pushCalled, false);
            assert.equal(pushCalled.key, mockCacheProvider.buildKey('TestServer'));

        });

        it('should push a RESET cache entry', function() {
            var server = new EventEmitter();
            server.token = 'TestServer';

            var unit = new CacheJsonMiddleware(server, mockCacheProvider);
            unit.handleReset();
            assert.notEqual(pushCalled, false);
            assert.equal(pushCalled.key, mockCacheProvider.buildKey('TestServer'));
            assert.equal(JSON.parse(pushCalled.entry).status, 'RESET');
        });
    });

    describe('#handle()', function(){
        it('should call next() so other middleware will work properly', function(done){
            var unit = new CacheJsonMiddleware(mockServer, mockCacheProvider);
            unit.handle(mockRequest, mockResponse, function(){
                done();
            });
        });

        it('should call the original write after collecting the data', function(){
            var unit = new CacheJsonMiddleware(mockServer, mockCacheProvider);
            unit.handle(mockRequest, mockResponse, function(){});
            mockResponse.write('SOME DATA');
            assert.equal(writeCalled, true);

        });

        it('should call the original end after data has ended', function(){
            var unit = new CacheJsonMiddleware(mockServer, mockCacheProvider);
            unit.handle(mockRequest, mockResponse, function(){});
            mockResponse.end('SOME DATA');
            assert.equal(endCalled, true);

        });

    });
});