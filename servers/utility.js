'use strict';

var archiveMarker = 1;

exports.getArchiveMarker = function() {
	return archiveMarker++;
}

exports.cacheEntry = function(status, url, jsonResponse) {
    var data = {
        timestamp : new Date().toJSON(),
        status : status,
        jsonResponse : jsonResponse,
        url : url
    };
    return JSON.stringify(data);
};