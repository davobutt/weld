var server = require('../servers/server')
var util = require('util')

exports.home = function(req, res) {
	res.render('layout')
}

exports.list = function(req, res) {
	res.render('server/list', {formValues:{}})
}

exports.listApi = function(req, res) {
	res.json(server.list().map(function(item) {
		return item.exposed();
	}))
}

exports.create = function(req, res) {
	var port = req.param('port')
	var name = req.param('name')
	var target = req.param('target')

	req.checkBody('port', 'Invalid port').notEmpty().isInt();
	req.checkBody('name', 'No Name').notEmpty();
	req.checkBody('target', 'No Target').notEmpty();
	
	if(target.indexOf("http://") == -1) {
		target = "http://" + target;
	}

	var formValues = {}
	var errors = req.validationErrors(true);
	if (errors) {
		formValues = {port:port, name:name, target:target}
	} else {
		server.add(port, name, target)
	}

	res.render('server/list', { errors:errors, formValues:formValues})
}

exports.stop = function(req, res) {
	var srv = server.get(req.params.serverId)
	if( srv === undefined) { return res.status(404).send() }
	srv.stopListening().then(function (server) {res.json(server.exposed())})
	
}

exports.start = function(req, res) {
	var srv = server.get(req.params.serverId)
	if( srv === undefined) { return res.status(404).send() }
	srv.startListening().then(function (server) {res.json(server.exposed())})
}

exports.detail = function(req, res) {
	var srv = server.get(req.params.serverId)
	if( srv === undefined) { return res.status(404).send() }
	res.json(srv.exposed())
}

exports.reset = function(req, res) {
	var srv = server.get(req.params.serverId)
	if( srv === undefined) { return res.status(404).send() }
	srv.resetCounts();
	res.json(srv.exposed());
}

exports.history = function(req, res) {
	var srv = server.get(req.params.serverId)
	if( srv === undefined) { return res.status(404).send() }
	srv.getResponses(function(result) {
		res.render('server/history', {data: result, server: srv})
	})
	
}

exports.test = function(req, res) {
	res.render('server/list2')
}

exports.createApi = function(req, res) {
	var port = req.query.port
	var name = req.params.serverId
	var target = decodeURIComponent(req.query.target)

	req.checkQuery('port', 'Invalid port').notEmpty().isInt();
  	req.checkParams('serverId', 'Invalid ServerId').notEmpty().isAlpha();
  	req.checkQuery('target', 'Invalid urlparam').notEmpty();

  	var errors = req.validationErrors();
  	if (errors) {
    	res.send('There have been validation errors: ' + util.inspect(errors), 400);
    	return;
  	}

  	if(target.indexOf("http://") == -1) {
		target = "http://" + target;
	}

	server.add(port, name, target, function(error, srv) {
		if(error) {
			res.status(400).send(error)
		} else {
			res.json(srv.exposed());
		}
	})
}

exports.remove = function(req, res) {
	var srv = server.get(req.params.serverId)
	if( srv === undefined) { return res.status(404).send() }
	server.remove(srv, function(error, result) {
		if(error) {
			res.status(400).send()
		} else {
			res.json(result.exposed())
		}
	})
}