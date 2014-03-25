'use strict';

require('colors');

var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    util = require('util'),
    db = require('./redisBacked'),
    moment = require('moment'),
    Promise = require('promise');

var servers = {};

var archiveMarker = 1;

var cacheEntry = function(status, url, jsonResponse) {
    var data = {
        timestamp : new Date().toJSON(),
        status : status,
        jsonResponse : jsonResponse,
        url : url
    };
    return JSON.stringify(data);
};

var readAndCacheJson = function(server) {

    return function (req, res, next) {
    var _write = res.write;
    var _end = res.end;
    var out = [];

    delete req.headers['accept-encoding'];

    res.end = function (data) {
        var content = res.getHeader('Content-Type');
        if( res.statusCode !== 200) {
            server.errorCount++;
            util.log(server.port + ' '+ server.name + ' received '.blue + String(res.statusCode).bold.red + ' ' + req.originalUrl.blue);
            server.pushToCache(cacheEntry(res.statusCode, req.originalUrl));
        }
        if (out !== undefined && content && content.indexOf('/json') != -1) {
            util.log(server.port + ' ' + server.name + ' response logged'.blue + ' type: '.green + util.inspect(res.getHeader('Content-Type')).yellow);
            var dataAsJson = JSON.parse(out.join(''));
            server.pushToCache(cacheEntry(res.statusCode, req.originalUrl, dataAsJson));
            server.goodCount++;
            server.lastMessageTimestamp = moment();
        }
      
        _end.call(res,data);
    };
    res.write = function (data) {
        out.push(data);
        _write.call(res, data);
    };
    next();
  };
};

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

    var app = connect.createServer(
        readAndCacheJson(this),
        function (req, res) {
            proxy.web(req, res);
        });

    this.httpServer = http.createServer(app);

    this.status = 'Stopped';
    db.clearCache(db.buildKey(this.token));
};

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
    this.pushToCache(cacheEntry('RESET'));
};

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
            archiveServer(server, callback);
        }, function() {
            callback('error', server);
        });
    } else {
        archiveServer(server, callback);
    }

};

var archiveServer = function(server, callback) {
    server.originalName = server.name;

    server.name = server.name + '@' + archiveMarker++;
    server.token = server.name.replace(' ', '_');
    server.httpServer = undefined;
    server.status = 'Archived';
    db.rename(db.buildKey(server.originalName), db.buildKey(server.token), function() {
        server.pushToCache(cacheEntry('ARCHIVED'));
    });

    servers[server.name] = server;
    delete servers[server.originalName];
    callback(null, server);
};

exports.archiveServer = archiveServer;

