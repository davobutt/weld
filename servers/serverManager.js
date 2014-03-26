'use strict';

require('colors');

var Server = require('./server').Server;

var servers = {};

exports.list = function() {
    return Object.keys(servers).map(function(key) {
        return servers[key];
    });
};

exports.get = function(serverId) {
    return servers[serverId];
};

exports.add = function(port, name, target, callback) {
    if(servers[name] === undefined) {
        var server = new Server(port, name, target);
        servers[name] = server;
        callback();
    } else {
        callback('Name in use');
    }

};

exports.remove = function(server, callback) {
    if (server.status === 'Listening') {
        server.stopListening().then(function() {
            exports.archiveServer(server, callback);
        }, function() {
            callback('error', server);
        });
    } else {
        exports.archiveServer(server, callback);
    }

};


exports.archiveServer = function(server, callback) {
    server.archiveServer(function(server) {
        servers[server.name] = server;
        delete servers[server.originalName];
        callback(server);
    });
};



