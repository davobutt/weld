var renderButton = function() {
	$('#server-button').html(_.template($("#server-button-template").html(), {status: status}))
	$('.action.stop').bind('click', function() {
		$.get('/api/server/' + serverName + '/stop').done(function(response) {
			status = response.status;
			renderButton();
		})
	})
	$('.action.reset').bind('click', function() {
		$.get('/api/server/' + serverName + '/reset').done(function(response) {
			status = response.status;
			renderButton();
		})
	})
	$('.action.start').bind('click', function() {
		$.get('/api/server/' + serverName + '/start').done(function(response) {
			status = response.status;
			renderButton();
		})
	})
}

$(function(){
	renderButton()
});

