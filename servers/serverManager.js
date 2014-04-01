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

exports.addServers = function(servers, callback) {
    var errors = [];
    servers.forEach(function(server) {
        exports.add(server.port, server.name, server.target, function(error){
            if (error !== undefined) {
                errors.push(server);
            }
        });
    });
    callback(errors);
};

exports.remove = function(server, callback) {
    server.stopListening().then(function() {
        server.archiveServer(function(server) {
            servers[server.name] = server;
            delete servers[server.originalName];
            callback(null, server);
        });
    }, function() {
        callback('error', server);
    });

};



