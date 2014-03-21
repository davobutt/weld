$(function(){

	var Servers = Backbone.Collection.extend({
		url: '/api/servers',
	});

	var ListView = Backbone.View.extend({
		el: $('#server-table'),
		initialize: function(){
			console.log('init');
			var self = this;
			_.bindAll(this, 'renderCollection', 'pollServer'); 

			this.collection = new Servers();
			this.collection.fetch().done(function(){
      			self.renderCollection();
    		});;
		},

		renderCollection: function() {
			var self = this;
			$(this.el).html("");
			this.collection.each( function(item){
        		//$(this.el).append(_.template($("#list-template").html(), item.toJSON()));
        		var sView = new ServerView({model: item});
        		this.$el.append(sView.render().el)
      		}, this);
		},

		pollServer: function() {
			var self = this;
			this.collection.fetch().done(function(){
      			self.renderCollection();
    		});;
    		setTimeout(this.pollServer, 15000)
		}
	})

	var ServerView = Backbone.View.extend({
		tagName: 'tr',
		initialize: function(){
    		_.bindAll(this, "render");
    		this.model.bind('change', this.render);
  		},
		render: function() {
			this.$el.html( _.template($("#list-template").html(), this.model.toJSON()))
			return this;
		},
		cleanup: function() {
		  	this.undelegateEvents();
		  	$(this.el).clear();
		},
		events: {
			'click .action.stop' : 'stop',
			'click .action.start' : 'start',
			'click .action.reset' : 'reset',
			'click .action.remove' : 'remove'
		},
		stop : function() {
			var self = this
			$.get('/api/server/' + this.model.get('name') + '/stop').done(function(response) {
				self.model.set('status', response.status)
			})
		},
		reset : function() {
			var self = this
			$.get('/api/server/' + this.model.get('name') + '/reset').done(function(response) {
				self.model.set('count', response.count)
			})
		},
		remove : function() {
			var self = this
			$.get('/api/server/' + this.model.get('name') + '/remove').done(function(response) {
				self.model.set('status', response.status)
				self.model.set('name', response.name)
			})
		},
		start : function() {
			var self = this
			$.get('/api/server/' + this.model.get('name') + '/start').done(function(response) {
				self.model.set('status', response.status)
		})}
	})


	var listView = new ListView();
	listView.pollServer();


});