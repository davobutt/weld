'use strict';
/**
 * Module dependencies.
 */

require('colors');

var express = require('express'),
    server = require('./routes/server'),
    http = require('http'),
    path = require('path'),
    expressValidator = require('express-validator'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    util = require('util'),
    moment = require('moment'),
    config = require('./config.json'),
    serveStatic = require('serve-static'),
    errorHandler = require('errorhandler'),
    serverManager = require('./servers/serverManager');

var app = express();

// all environments
app.set('port', config.weldPort || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
//app.usnpme(express.logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride());
app.use(serveStatic(path.join(__dirname, 'public')));

app.locals.moment = moment;

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

if(config.servers && config.servers.length > 0) {
	serverManager.addServers(config.servers, function(serversInError) {
		serversInError.forEach(function(server) {
			util.log('Couldn\'t configure ' + server.name.blue + ' ' + server.port + ' to ' + server.target);
		});
	});
}

app.get('/', server.home);
app.get('/api/servers', server.listApi);
app.get('/api/server/:serverId/stop', server.stop);
app.get('/api/server/:serverId/start', server.start);
app.get('/api/server/:serverId/reset', server.reset);
app.get('/api/server/:serverId', server.detail);
app.get('/api/server/:serverId/create', server.createApi);
app.get('/api/server/:serverId/remove', server.remove);

app.get('/servers/', server.list);
app.post('/servers/', server.create);
app.get('/server/:serverId', server.history);

http.createServer(app).listen(app.get('port'), function(){
  util.log('WELD'.bold.yellow + ' admin server running on port '.yellow + String(app.get('port')).green);
});

