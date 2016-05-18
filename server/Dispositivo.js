//Dependencias


//Dependencias
var arduinode = arduinode || {},
	socket				= require('./socket')(),
	express 			= require('express'),
	app 				= express(),
	DateConvert 		= require('./utils/DateConvert')(),
	socketListen 		= null,
	//Lib para interceptar requests a Socket.IO y enviar hora del servidor
	middleware 			= require('socketio-wildcard')(),
	serverInfo 			= {host: "localhost", port:8888 },
	fs					= require('fs'),
	compress 			= require('compression');
	app.use(compress());
	var http 			= require('http').Server(app),
	programadorTareas 	= require('./config/programadorTareas'),
	serverConfig 		= {},
	ArrayUtils 			= require('./utils/ArrayUtils')(),
	// Configuración servidor Express
	expressConfig 		= require('./config/config').config(app, express),
	io 					= require('socket.io')(http),
	//Socket para comunicacion con servidor Arduino
	net 				= require('net'),
	const ON = 0, OFF = 1;
	arduinode			= require('Arduino.js');
	//Carga de controladores
	require('./controllers')(arduinode);

//Global namespace
arduinode.socket = socket;


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
		console.log("Ocurrió un error:", err);
	});

	//Cargo los dispositivos desde el archivo json
	arduinode.dispositivos.load();

	//Se dispara cuando un cliente se conecta
	io.on('connection', function( sCliente )
	{
		arduinode.sCliente = sCliente;
		//Accion sobre una salida (Persiana, Luz, Bomba)
		sCliente.on('accionarSalida', function(params){
			arduinode.dispositivos.accionar(params, function(response){
				sCliente.emit('accionarResponse', response);
			});
		});

		//Devuelve lista de salidas de un dispositivo (con sus estados)
		sCliente.on('getSalidas', function(params,p) {
			if (params.page == 'salidasEncendidas') {
				arduinode.dispositivos.getSalidasEncendidas(function(salidas){
					sCliente.emit('salidas',salidas);
				});
			}
			else {
				var disp = arduinode.dispositivos.getByIP(params.ip);
				disp.getSalidas(params, function(salidas){
					sCliente.emit('salidas',salidas);
				});
			}
		});
	});
});