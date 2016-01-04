var config = require('./env.json'),
	session = require('express-session'),
	minify = require('express-minify'),
	bodyParser = require('body-parser');

module.exports.config = function( app, express) {
	var node_env = process.env.NODE_ENV || 'desarrollo';

	if ( app.get('desarrollo') )
	{
		app.use(express.errorHandler());
	}

	app.set('port', process.env.PORT || 8880);
	app.enable('view cache');

	//Cookies
	app.use(session({
		resave: true,
		saveUninitialized: true,
		expires : new Date(Date.now() + 36000),
		secret: 'uwotm8' })
	);

	//Encoding
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	//app.use(minify());
	//Entrega los archivos de tipo css, jss, jpg, etc
	app.use(express.static('../client'));
	
	return config[node_env];
};