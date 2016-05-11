'use strict';

//Dependencias
var express 			= require('express'),
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
	arduino 			= require('./Arduino')(),
	DataStore			= require('./config/db')(app, expressConfig);
	//Carga de controladores
	require('./controllers')(app);

//Crea o trae el archivo de configuracion para el servidor y Programador de tareas

var path = './config/config.json';

if (!fs.existsSync(path))
{
	fs.writeFileSync(path, '{"ip":"localhost","port":8888,"tiempoEscaneoTareas":300000}');
}

serverConfig = require(path);

//Server HTTP
http.listen(serverConfig.port, serverConfig.ip, function()
{
	console.log("Server iniciado en: ", serverConfig.ip +":"+serverConfig.port);

	//Captura excepciones para no detener el servidor
	process.on('uncaughtException', function (err)
	{
		console.log(err)
	});

	//Abre el archivo json, y cargo campos temporales
	DataStore.getFile('dispositivos',function()
	{
		DataStore.updateDispositivo();
		DataStore.getFile('tareas',function()
		{
			programadorTareas.setConfig(serverConfig);
			programadorTareas.importar();
			//	Si se apaga una salida que tenia una tarea programada
			//	este servicio relanza la misma
			programadorTareas.observarCambios();
		});
	});

	io.use(middleware);

	//Se dispara cuando un cliente se conecta
	io.on('connection', function( sCliente )
	{
		//Envio hora del servidor en cada request Socket.IO
		sCliente.on('*', function(){
			sCliente.emit('horaServidor', new Date().getTime());
		});

		// Crea el socket para escuchar los arduinos, solo si no fue levantado
		if (!socketListen) {

			socketListen = net.createServer(function( socket ) {
				socket.on('data', function( data ) {
					var data = data.toString().replace('\r\n',''),
						salida = arduino.parseSalida({
							ip:socket.remoteAddress
						}, data);
					sCliente.broadcast.emit('switchBroadcast', salida);
				});
			});

			socketListen.listen({ host:serverConfig.ip, port: serverConfig.port + 1},
				function(){
					console.log('Socket escuchando arduinos en:'
								,socketListen.address().address,':'
								,socketListen.address().port);
			});
		}

		// Paso instancia de Socket.IO para informar errores al usuario
		arduino.socketClient = sCliente;
		arduino.init();
		programadorTareas.socketClient = sCliente;

		// Escucha evento para obtener listado de luces encendidas
		sCliente.on('getSalidasActivas', function(params)
		{
			sendSalidasActivas(params);
		});

		// Envia listado de salidas activas al cliente
		var sendSalidasActivas = function(params) {
			var salidasAux = [],
				sockets = [];

			DataStore.currentFiles[0].forEach(function(item, key, array)
			{
				var salidas,
				connectedSuccess = false,
				encendidas = [],
				params = {
					noError: true,
					ip: item.ip,
					id_disp: item.id_disp,
					filterByEstado: '0'
				}

				sockets[key] = new net.Socket();
				sockets[key].setTimeout(1000);
				sockets[key].connect(8000, item.ip, function(response)
				{
					connectedSuccess = true;
					sockets[key].write('G')
				})
				sockets[key].on('timeout',function(_err)
				{
					sCliente.emit('salidasActivas', []);
				});

				sockets[key].on('data',function(_data)

				{
					item.buffer+= _data;
				});

				//Si fallo la conexión, aviso al cliente con un array nulo
				sockets[key].on('error',function(_err)
				{
					sCliente.emit('salidasActivas', []);
				});
				sockets[key].on('end',function()
				{
					//Transformo el buffer en un aray
					item.buffer = item.buffer.split('\r\n');
					//Remueve el ultimo elemento porque viene vacio
					item.buffer.pop();

					if (item.buffer.length > 0 && connectedSuccess)
					{
						//Reccorro buscando los encendidos
						item.buffer.forEach( function( i )
						{
							if (i.indexOf( ':0' ) > 0 )
							{
								encendidas.push( i )
							}
						});
						params.salidasOrig = item.salidas;
						item.buffer = "";
						var encendidasF = arduino.formatSalidas(params,encendidas),
							uniqueEncendidas = ArrayUtils.unique(encendidasF);

						sCliente.emit('salidasActivas', uniqueEncendidas);
					}
				});
			});
		}

		// Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
		sCliente.on('getSalidas', function(params)
		{
			sendSalidas(params);
		});

		var sendSalidas = function( params ) {
			params.noError = true;
			var dispositivo = DataStore.findDispositivo('ip',params.ip);
			if (dispositivo.length > 0)
			{
				arduino.getSalidas(params, function(salidas)
				{
					var salidas = ArrayUtils.mixArrays(dispositivo[0].salidas, salidas);
					dispositivo[0].salidas = salidas;
					sCliente.emit('salidas', dispositivo[0]);
				});
			}
		}

		// Sube,baja o detiene las persianas
		sCliente.on('movePersiana', function(params)
		{
			arduino.movePersiana(params, function(response)
			{
				sCliente.emit('moveResponse', response);
			});
		});

		// Setea el estado de una salida, ON/OFF
		sCliente.on('switchSalida', function(params)
		{
			switchSalida( params );
		});

		// Se llama cuando se acciona una salida
		// Desde la aplicacion p desde un switch real
		var switchSalida = function( params ) {
			params.noError = true;
			arduino.switchSalida(params, function(response)
			{
				var estadoFinal = (response === null) ? params.estado_orig : response;
				params.estado = estadoFinal;
				
				//Actualizo la salida switcheada a todos los sockets
				sCliente.broadcast.emit('switchBroadcast', params);
				//Aviso el resultado del switch al socket que hizo switch
				sCliente.emit('switchResponse', estadoFinal);

			});
		}
	});
});