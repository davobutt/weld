'use strict';

var cacheEntry = require('./utility').cacheEntry;
var moment = require('moment');
var util = require('util');
var redisBackedCacheProvider = require('./redisBacked');

var CacheJsonMiddleware = function(server, cacheProvider) {
    
    this.cacheProvider = cacheProvider || redisBackedCacheProvider;
    this.server = server;
    var self = this;
    
    server.on('reset', function() {
        self.handleReset();
    });

    this.handle = function (req, res, next) {
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

exports.CacheJsonMiddleware = CacheJsonMiddleware;

CacheJsonMiddleware.prototype.handleReset = function() {
    var key = this.cacheProvider.buildKey(this.server.token);
    var entry = cacheEntry('RESET');
    this.cacheProvider.pushToCache(key, entry, function() {});
};