var util = require('util'),
    colors = require('colors'),
    http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    redis = require('redis'),
    db = redis.createClient();

//
// Basic Connect App
//

var readAndCacheJson = function() {

    return function (req, res, next) {
    var _write = res.write;
    var _end = res.end;
    var out = []

    delete req.headers['accept-encoding']

    res.end = function (data) {
      var content = res.getHeader('Content-Type')

      if (out !== undefined && content && content.indexOf('/json') != -1) {
        util.puts('response logged'.blue + ' type: '.green + util.inspect(res.getHeader('Content-Type')).yellow)
        db.lpush('proxy', out.join(''), function(){})  
      } 
      
      _end.call(res,data)
    }
    res.write = function (data) {
      
      out.push(data);
      //util.puts(data.toString().yellow)
      //db.lpush('proxy', data.toString(), redis.print)
      _write.call(res, data);
    }
    next();
  }
}

connect.createServer(
  readAndCacheJson(),
  function (req, res) {
    proxy.web(req, res);
  }
).listen(8013);

//
// Basic Http Proxy Server
//
var proxy = httpProxy.createProxyServer({
  // target: 'http://localhost:9013'
  target: 'http://ask.globalmine.com'
});

//
// Target Http Server
//
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({wow:123}));
}).listen(9013);

util.puts('http proxy server'.blue + ' started '.green.bold + 'on port '.blue + '8013'.yellow + ' to '.blue + proxy.options['target'].green.bold);
util.puts('test http server '.blue + 'started '.green.bold + 'on port '.blue + '9013 '.yellow);