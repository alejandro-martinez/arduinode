//Dependencias
var arduinode 			= arduinode || {},
	express 			= require('express'),
	app 				= express();
var fs					= require('fs'),
	compress 			= require('compression'),
	http 				= require('http').Server(app),
	programadorTareas 	= require('./config/programadorTareas'),
	expressConfig 		= require('./config/config').config(app, express),
	arduinode			= require('./Arduino');
	middleware 			= require('socketio-wildcard')(),
	io 					= require('socket.io')(http),
	require('./controllers')(app);
	app.use(compress());

var serverConfig = {},
	serverInfo	 = { host: "localhost", port:8888 },
	configPath 	 = './config/config.json'

//Crea o trae el archivo de configuracion para el servidor y Programador de tareas
if (!fs.existsSync(configPath))
{
	fs.writeFileSync(configPath, '{"ip":"localhost","port":8888, "tiempoEscaneoTareas":300000}');
}
var serverConfig = require(configPath);

//Server HTTP
http.listen(serverConfig.port, serverConfig.ip, function()
{
	console.log("Server iniciado en: ", serverConfig.ip +":"+serverConfig.port);

	//Captura excepciones para no detener el servidor
	process.on('uncaughtException', function (err)
	{
		console.log("Ocurrió un error:", err);
	});

	//Cargo lista de dispositivos en memoria
	arduinode.dispositivos.load();

	//Carga lista de tareas en memoria
	programadorTareas.setConfig( serverConfig );
	programadorTareas.loadTareas();

	//Servicio que continua la ejecución de tareas en caso de falla
	programadorTareas.observarCambios();

	//Registra middleware para capturar requests y enviar la hora del server
	io.use(middleware);

	//Conexión de un cliente
	io.on('connection', function( sCliente )
	{
		//Seteo referencia al socket conectado
		app.sCliente = arduinode.dispositivos.sCliente = sCliente;

		//Crea socket que recibe eventos de los disp. Arduino
		arduinode.listenSwitchEvents( serverConfig );

		//Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('accionarSalida', function( params ) {
			arduinode.dispositivos.accionar(params, function(response) {
				sCliente.emit('accionarResponse', response);
				sCliente.broadcast.emit('switchBroadcast', params);
			});
		});

		//Devuelve lista de salidas de un dispositivo (con sus estados)
		sCliente.on('getSalidas', function(params,p) {
			var action = "get" + params.page,
				onData = function(salidas) {
					sCliente.emit('salidas',salidas);
				};
			arduinode.dispositivos[action](onData, params);
		});

		//Envia la hora del servidor en cada request Socket.IO
		sCliente.on('*', function() {
			sCliente.emit('horaServidor', new Date().getTime());
		});
	});
});