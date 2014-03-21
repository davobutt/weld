
/**
 * Module dependencies.
 */

var express = require('express')
  , colors = require('colors')
  , server = require('./routes/server')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , httpProxy = require('http-proxy')
  , expressValidator = require('express-validator')
  , redis = require('redis')
  , util = require('util')
  , moment = require('moment')
  , db = redis.createClient();

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(expressValidator());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.locals.moment = moment;

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.get('/', server.home);
app.get('/api/servers', server.listApi)
app.get('/api/server/:serverId/stop', server.stop)
app.get('/api/server/:serverId/start', server.start)
app.get('/api/server/:serverId/reset', server.reset)
app.get('/api/server/:serverId', server.detail)
app.get('/api/server/:serverId/create', server.createApi)
app.get('/api/server/:serverId/remove', server.remove)

app.get('/servers/', server.list);
app.post('/servers/', server.create);
app.get('/server/:serverId', server.history)

http.createServer(app).listen(app.get('port'), function(){
  util.log('WELD'.bold.yellow + ' admin server running on port '.yellow + String(app.get('port')).green)
});
