module.exports = function(arduinode){

	arduinode.app.get('/', function(req, res){
		res.sendfile('index.html');
	});
};