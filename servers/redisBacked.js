'use strict';

var redis = require('redis'),
    client = redis.createClient();

var KEY_PREFIX = 'PROXY-CACHE-';

exports.buildKey = function(identifier) {
    return KEY_PREFIX + identifier;
};

exports.clearCache = function(key, callback) {
    client.del(key, function() {
        if (callback !== undefined) {
            callback();
        }
    });
};

exports.pushToCache = function(key, entry, callback) {
    client.lpush(key, entry, function(){
        if (callback !== undefined) {
            callback();
        }
    });
};

exports.rename = function(key, newKey, callback) {
    client.rename(key, newKey, function() {
        callback();
    });
};

exports.getResponses = function(key, callback) {
    client.lrange(key, 0, 100, function(err, replies){
        var data = [];
        replies.forEach(function(reply) {
            data.push(JSON.parse(reply));
        });
        callback(data);
    });
};