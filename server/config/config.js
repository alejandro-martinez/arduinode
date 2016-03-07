var session = require('express-session'),
	minify = require('express-minify'),
	bodyParser = require('body-parser');

module.exports.config = function( app, express) {
	app.set('modelsPath',process.cwd() + '/models/');
	app.set('port', process.env.PORT || 8888);
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
	var cache = { maxAge: 86400000 * 365 }
	app.use(express.static('../client', cache));
};