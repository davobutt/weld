/* global describe, it, beforeEach */
'use strict';

var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var rewire = require('rewire');

var server = rewire('../../servers/server');
var Server = server.Server;

var mockHttpServer = new EventEmitter();
mockHttpServer.listen = function() {};
mockHttpServer.close = function() {};

server.__set__('http', {
    createServer: function() {
        return mockHttpServer;
    }
});

server.__set__('util', {
    puts: function(){},
    log: function(){},
    inspect: function(){}
});

server.__set__('getArchiveMarker', function() {
        return 22;
    }
);

var pushToCacheCalled = false;
var renameCalled = false;
var clearCacheCalled = false;
var getReponsesCalled = false;

var mockReponses = [{some:'test', data:12345}, {some:'more', data:12}];

var originalBuildKey = server.__get__('db').buildKey;

server.__set__('db', {
    buildKey: originalBuildKey,
    pushToCache: function(key, entry) {
        pushToCacheCalled = {key: key, entry: entry};
    },
    clearCache: function(key){
        clearCacheCalled = {key: key};
    },
    rename: function(oldName, newName, callback){
        renameCalled = {newName: newName, oldName: oldName};
        callback();
    },
    getResponses: function(key, callback) {
        getReponsesCalled = {key: key};
        callback(mockReponses);
    }
});

describe('Server', function(){

    beforeEach(function() {
        pushToCacheCalled = false;
        renameCalled = false;
        clearCacheCalled = false;
        getReponsesCalled = false;
    });

    describe('#Server()', function() {
        it('should clear the cache in case there is old stuff in there' , function() {
            new Server(1234, 'TestClearCache');
            assert.equal(clearCacheCalled.key, originalBuildKey('TestClearCache'));
        });
    });

    describe('#resetCounts()', function(){
        it('should reset the counters and push event to the log', function(){
            var unit = new Server(1234, 'Test');
            unit.goodCount = 123;
            unit.errorCount = 999;
            unit.resetCounts();
            assert.equal(unit.goodCount, 0);
            assert.equal(unit.errorCount, 0);
            assert(pushToCacheCalled);
        });
    });

    describe('#count()', function() {
        it('should sum the counts', function() {
            var unit = new Server(1234, 'Test');
            unit.goodCount = 123;
            unit.errorCount = 999;
            assert.equal(unit.count(), 1122);
        }) ;
    });

    describe('#archiveServer', function() {
        it('should rename the server using the archive marker', function() {
            var unit = new Server(1234, 'Test');
            unit.archiveServer(function() {});
            assert.equal(unit.name, 'Test@22');
        });

        it('should clear out the httpServer', function(done) {
            var unit = new Server(1234, 'Test');
            unit.archiveServer(function() {
                assert.equal(unit.httpServer, undefined);
                done();
            });
            
        });

        it('should rename the cache', function(done) {
            var unit = new Server('1234', 'Test', 'Target');
            unit.archiveServer(function() {
                assert.equal(renameCalled.oldName, originalBuildKey('Test'));
                assert.equal(renameCalled.newName, originalBuildKey('Test@22'));
                done();
            });
        });

        it('should log the ARCHIVE event to the newly renamed cache', function(done) {
            var unit = new Server('1234', 'Test', 'Target');
            unit.archiveServer(function() {
                assert.equal(pushToCacheCalled.key, originalBuildKey('Test@22'));
                assert.equal(JSON.parse(pushToCacheCalled.entry).status, 'ARCHIVED');
                done();
            });
            
        });
    });

    describe('#startListening', function() {
        
        it('should fulfill promise if server is already listening', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.status = 'Listening';
            unit.startListening().then(function() {
                done();
            }).done();
        });

        it('should fulfill promise when server listens', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.startListening().then(function() {
                done();
            }).done();
            unit.httpServer.emit('listening');
        });

        it('should fulfill promise when server listens, further listening events have no effect', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            var count = 0;
            unit.startListening().then(function() {
                count++;
            }).done();
            unit.httpServer.emit('listening');
            unit.httpServer.emit('listening');
            unit.httpServer.emit('listening');
            unit.httpServer.emit('listening');
            setTimeout(function() {
                assert.equal(count, 1);
                done();
            }, 100);
        });

        it('should log a LISTEN event to the cache', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.startListening().then(function() {
                assert.equal(JSON.parse(pushToCacheCalled.entry).status, 'LISTEN');
                assert.equal(pushToCacheCalled.key, originalBuildKey('Test'));
                done();
            }).done();
            unit.httpServer.emit('listening');
        });
    });

    describe('#stopListening()', function() {

        it('should fulfill promise if server is already stopped', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.status = 'Stopped';
            unit.stopListening().then(function() {
                done();
            }).done();
        });

        it('should fulfill promise when server closes', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.status = 'Listening';
            unit.stopListening().then(function() {
                done();
            }).done();
            unit.httpServer.emit('close');
        });

        it('should fulfill promise when server closes, further close events have no effect', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.status = 'Listening';
            var count = 0;
            unit.stopListening().then(function() {
                count++;
            }).done();
            unit.httpServer.emit('close');
            unit.httpServer.emit('close');
            unit.httpServer.emit('close');
            unit.httpServer.emit('close');
            unit.httpServer.emit('close');
            setTimeout(function() {
                assert.equal(count, 1);
                done();
            }, 100);
        });

        it('should log a STOP event to the cache', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.status = 'Listening';
            unit.stopListening().then(function() {
                assert.equal(JSON.parse(pushToCacheCalled.entry).status, 'STOP');
                assert.equal(pushToCacheCalled.key, originalBuildKey('Test'));
                done();
            }).done();
            unit.httpServer.emit('close');
        });
    });


    describe('#getResponses()', function() {
        it('should request the entries from the cache, and call the callback with the data', function(done) {
            var unit = new Server(1234, 'Test', 'Target');
            unit.getResponses(function(data) {
                assert.deepEqual(data, mockReponses);
                assert.equal(getReponsesCalled.key, originalBuildKey('Test'));
                done();
            });
        });
    });
});