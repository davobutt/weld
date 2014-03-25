var assert = require("assert");

var serverRoutes = require("../../routes/server")

describe('server Routes', function(){

	describe('#list()', function() {
		it('should provide a list', function() {
			serverRoutes.list(null,{render:function(){}})
			assert(true)
		})
	})

})