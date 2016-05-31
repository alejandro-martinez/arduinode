//Dependencias
var arduinode = arduinode || {},
	express 			= require('express'),
	app 				= express(),
	//Lib para interceptar requests a Socket.IO y enviar hora del servidor
	socketListen 		= null,
	middleware 			= require('socketio-wildcard')(),
	serverInfo 			= {host: "localhost", port:8888 },
	fs					= require('fs'),
	compress 			= require('compression');
	app.use(compress());
	var http 			= require('http').Server(app),
	programadorTareas 	= require('./config/programadorTareas'),
	serverConfig 		= {},
	// Configuración servidor Express
	expressConfig 		= require('./config/config').config(app, express),
	io 					= require('socket.io')(http),
	arduinode			= require('./Arduino');
	//Carga de controladores
	require('./controllers')(app);

//Crea o trae el archivo de configuracion para el servidor y Programador de tareas
var path = './config/config.json';
if (!fs.existsSync(path))
{
	fs.writeFileSync(path, '{"ip":"localhost","port":8888, "tiempoEscaneoTareas":300000}');
}

var serverConfig = require(path);

//Server HTTP
http.listen(serverConfig.port, serverConfig.ip, function()
{
	console.log("Server iniciado en: ", serverConfig.ip +":"+serverConfig.port);

	//Captura excepciones para no detener el servidor
	process.on('uncaughtException', function (err)
	{
	//	console.log("Ocurrió un error:", err);
	});

	//Cargo lista de dispositivos en memoria
	arduinode.dispositivos.load();

	//Carga listado de tareas en memoria
	programadorTareas.setConfig( serverConfig );
	programadorTareas.loadTareas();
	programadorTareas.observarCambios();

	// Servicio que continua la programación de tareas en caso de falla
	//programadorTareas.observarCambios();

	//Se dispara cuando un cliente se conecta
	io.on('connection', function( sCliente )
	{

		programadorTareas.sCliente = sCliente;
		arduinode.dispositivos.sCliente = sCliente;

		// Crea el socket que recibe eventos de los disp. Arduino
		arduinode.listenSwitchEvents( serverConfig );

		//Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('accionarSalida', function( params ){
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
	});
});