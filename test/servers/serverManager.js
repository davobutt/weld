'use strict';

var assert = require('assert');
var rewire = require('rewire');

var server = rewire('../../servers/serverManager');

describe('ServerManager', function() {

    describe('#archiveServer', function () {
        it('should move the server in the store', function(done) {
            server.add('1234', 'Test', 'Target', function(){});
            assert.equal(server.get('Test@1'), undefined);

            server.archiveServer(server.get('Test'), function() {
                assert.notEqual(server.get('Test@1'), undefined);
                assert.strictEqual(server.get('Test'), undefined);
                done();
            });

        });
    });
});