var http = require('http')
  , redis = require('redis')
  , client = redis.createClient();

exports.index = function(req, res){

	client.hset("config", "Something", '{"count":123, "target":"http://www.something.com:2131"}');

	client.hgetall("config", function (err, replies) {
        for( item in replies) {
        	console.log(replies[item])
        	replies[item] = JSON.parse(replies[item])
        }
        res.render('index', { config: replies });
        client.quit();
    });
};