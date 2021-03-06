'use strict';

var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    util = require('util'),
    db = require('./redisBacked'),
    moment = require('moment'),
    ut = require('./utility'),
    Promise = require('promise'),
    EventEmitter = require('events').EventEmitter,
    CacheJsonMiddleware = require('./cacheJson').CacheJsonMiddleware;

var cacheEntry = ut.cacheEntry;
var getArchiveMarker = ut.getArchiveMarker;

var Server = function(port, name, target) {
    
    this.port = port;
    this.name = name;
    this.target = target;
    this.token = this.name.replace(' ','_');
    this.goodCount = 0;
    this.errorCount = 0;

    var proxy = httpProxy.createProxyServer({
        target: target
    });

    var app = connect();
    app.use(new CacheJsonMiddleware(this));
    app.use(function(req, res) {
        proxy.web(req, res);
    });


    this.httpServer = http.createServer(app);

    this.status = 'Stopped';
    db.clearCache(db.buildKey(this.token));
};

util.inherits(Server, EventEmitter);

exports.Server = Server;
Server.exposedFields = ['status', 'port', 'id', 'name', 'count', 'target', 'errorCount', 'goodCount'];

Server.prototype.pushToCache = function(cacheEntry) {
    db.pushToCache(db.buildKey(this.token), cacheEntry);
};

Server.prototype.count = function() {
    return this.errorCount + this.goodCount;
};

Server.prototype.stopListening = function() {
    var server = this;
    if (server.status === 'Stopped') {
        return new Promise(function(resolve) {
            resolve(server);
        });
    }
    var promise = new Promise(function (resolve, reject) {
        server.httpServer.once('close', function() {
            util.log(server.name + ' proxy server'.blue + ' stopped '.red.bold + 'on port '.blue + String(server.port).yellow);
            server.pushToCache(cacheEntry('STOP'));
            server.setStatus('Stopped');
            resolve(server);
        }).once('error', function(error) {
            server.status = 'Error';
            server.error = error;
            reject(error);
        });
    });
    server.httpServer.close();
    return promise;
};

Server.prototype.setId = function(id) {
    this.id = id;
};

Server.prototype.setStatus = function(status) {
    this.status = status;
};

Server.prototype.getResponses = function(callback) {
    db.getResponses(db.buildKey(this.token), function(data) {
        callback(data);
    });
};

Server.prototype.startListening = function() {
    var server = this;
    if (server.status === 'Listening') {
        return new Promise(function(resolve) {
            resolve(server);
        });
    }
    
    var promise = new Promise(function (resolve, reject) {
        server.httpServer.once('listening', function() {
            util.log(server.name + ' proxy server'.blue + ' started '.green.bold + 'on port '.blue + String(server.port).yellow + ' to '.blue + server.target.green.bold);
            server.pushToCache(cacheEntry('LISTEN'));
            server.status = 'Listening';
            resolve(server);
        }).once('error', function(error) {
            server.status = 'Error';
            server.error = error;
            reject(error);
        });
    });
    server.httpServer.listen(this.port);
    return promise;
};

Server.prototype.exposed = function() {
    var output = {};
    var self = this;
    Server.exposedFields.forEach(function(field) {
        if(typeof(self[field]) == 'function') {
            output[field] = self[field]();
        } else {
            output[field] = self[field];
        }
        
    });
    return output;
};

Server.prototype.resetCounts = function() {
    this.goodCount = 0;
    this.errorCount = 0;
    this.emit('reset');
};

Server.prototype.archiveServer = function(callback) {
    var server = this;
    server.originalName = server.name;

    server.name = server.name + '@' + getArchiveMarker();
    server.token = server.name.replace(' ', '_');
    server.httpServer = undefined;
    server.status = 'Archived';
    db.rename(db.buildKey(server.originalName), db.buildKey(server.token), function() {
        server.emit('archived');
        //server.pushToCache(cacheEntry('ARCHIVED'));
    });

    callback(server);
};