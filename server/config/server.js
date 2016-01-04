var config = require('env');

exports.config = function() {
	var node_env = process.env.NODE_ENV || 'desarrollo';
	return env[node_env];
}();