/* global describe, it, beforeEach */
'use strict';

var assert = require('assert');
var rewire = require('rewire');
var Promise = require('promise');

var server = rewire('../../servers/serverManager');

describe('ServerManager', function() {

    beforeEach(function() {
        server.__set__('servers', {});
    });

    describe('#remove()', function () {
        it('should move the server in the store', function(done) {
            server.add('1234', 'Test', 'Target', function(){});
            assert.equal(server.get('Test@1'), undefined);
            server.get('Test').status = 'Stopped';
            server.remove(server.get('Test'), function() {
                assert.notEqual(server.get('Test@1'), undefined);
                assert.strictEqual(server.get('Test'), undefined);
                done();
            });
        });

        it('should archive the server', function(done) {
            server.add('1234', 'Test', 'Target', function(){});
            assert.equal(server.get('Test@1'), undefined);
            var archiveCalled = false;
            var testServer = server.get('Test');
            testServer.status = 'Stopped';
            testServer.archiveServer = function(callback) {
                archiveCalled = true;
                callback(testServer);
            };
            server.remove(testServer, function() {
                assert.equal(archiveCalled, true);
                done();
            });
        });

        it('should call the callback with error if the stop fails', function(done) {
            server.add('1234', 'Test', 'Target', function(){});
            
            var testServer = server.get('Test');
            testServer.stopListening = function() {
                return new Promise(function(resolve, reject) {
                    reject(testServer);
                });
            };


            server.remove(server.get('Test'), function(error, server) {
                assert.equal(error, 'error');
                assert.deepEqual(server, testServer);
                done();
            });

        });
    });

    describe('#add()', function () {
        it('should add the server to the store', function() {
            server.add('1234', 'Test', 'Target', function(){});
            var retreivedServer = server.get('Test');
            assert.equal(retreivedServer.name, 'Test');
            assert.equal(retreivedServer.port, 1234);
            assert.equal(retreivedServer.target, 'Target');
        });

        it('should return an error when the servers name clashes', function(done) {
            server.add('1234', 'Test', 'Target', function(error){
                assert.equal(error, undefined);
                server.add('1234', 'Test', 'Target', function(error){
                    assert.equal(error, 'Name in use');
                    done();
                });
            });
        });
    });

});