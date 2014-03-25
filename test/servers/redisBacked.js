var assert = require("assert");
var rewire = require("rewire");
var redisWrapper = rewire("../../servers/redisBacked")

var TEST_KEY_PREFIX = "TEST-";

var mockCacheEntries = [JSON.stringify({timestamp: new Date().toJSON(), status:"TEST_STATUS", jsonResponse: {some:"test", data: 1234}}),
						JSON.stringify({timestamp: new Date().toJSON(), status:"TEST_STATUS2", jsonResponse: {some:"test", data: 999}})]

var mockRedis = {
	delCalled: false,
	lpushCalled: false,
	renameCalled: false,
	lrangeCalled: false,
	del: function(key, callback) {
		this.delCalled = key;
		callback();
	},
	lpush : function(key, entry, callback) {
		this.lpushCalled = key
		assert(entry.timestamp)
		assert(entry.status)
		callback()
	},
	rename: function(key, newKey, callback) {
		this.renameCalled = {key: key, newKey: newKey }
		callback()
	},
	lrange: function(key, startIndex, endIndex, callback) {
		this.lrangeCalled = {key: key, startIndex: startIndex, endIndex: endIndex}
		callback(null, mockCacheEntries)
	}
}

redisWrapper.__set__("client", mockRedis);
redisWrapper.__set__("KEY_PREFIX", TEST_KEY_PREFIX)

describe('redisBacked', function(){

  	beforeEach(function(){
    	mockRedis.delCalled = false;
    	mockRedis.lpushCalled = false;
    	mockRedis.renameCalled = false;
    	mockRedis.lrangeCalled = false;
  	})

  	describe('#buildKey()', function(){
    	it('should prefix the identifier with a prefix', function(){
      		assert.equal(redisWrapper.buildKey("token"), TEST_KEY_PREFIX + "token");

    	})
  	})

	describe('#clearCache()', function(){
    	it('should tell redis to delete the entry and call the callback', function(done){
      		redisWrapper.clearCache("token", function() {
      			assert(mockRedis.delCalled, "token")
      			done();
      		});
      	})

      	it('should tell redis to delete the entry and callback isnt required', function(){
      		redisWrapper.clearCache("token")
      		assert(mockRedis.delCalled, "token")

      	})

    })

    describe('#pushToCache()', function(){
    	it('should push entry to redis and call the callback', function(done){

    		var entry = {timestamp: new Date(), status:"WOW"};

      		redisWrapper.pushToCache("token", entry, function() {
      			assert(mockRedis.lpushCalled, "token")
      			done();
      		});

    	})
    	it('should push entry to redis callback isnt required', function(){

    		var entry = {timestamp: new Date(), status:"WOW"};

      		redisWrapper.pushToCache("token", entry)
      		assert(mockRedis.lpushCalled, "token")
    	})
  	})

  	describe('#rename()', function() {
  		it('should rename the entry with redis rename and call back', function(done) {
  			redisWrapper.rename("oldName", "newName", function() {
  				assert.equal(mockRedis.renameCalled.key, "oldName")
  				assert.equal(mockRedis.renameCalled.newKey, "newName")
  				done();
  			})

  		})
  	})

  	describe('#getResponses', function() {
  		it('should call lrange with the right key and call back with the parsed data', function(done) {
  			redisWrapper.getResponses("KEY", function(data) {
  				assert.deepEqual(data[0].jsonResponse, {some:"test", data:1234})
  				assert.deepEqual(data[1].jsonResponse, {some:"test", data:999})
  				assert.equal(mockRedis.lrangeCalled.key, "KEY")
  				assert.equal(mockRedis.lrangeCalled.startIndex, 0)
  				assert.equal(mockRedis.lrangeCalled.endIndex, 100)
  				done()
  			})
  		})
  	})

})