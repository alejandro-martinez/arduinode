'use strict';

//Timeout global del servidor
//Dependencias
var express = require('express'),
	app 	= express(),
	timeout = 0,
	salidasState = {
		salidas: [],
		timestamp: new Date().getTime(),
		updateTimeStamp: function() {
			this.timestamp = new Date().getTime();
		}
	},
	intervalo = 0,
	serverInfo = {host: "localhost", port:8888 },
	fs		= require('fs'),
	compress = require('compression');
	app.use(compress());
	var http 	= require('http').Server(app),
	notBroadcasted = true,
	programadorTareas = require('./config/programadorTareas'),
	serverConfig = {},
	ArrayUtils = require('./utils/ArrayUtils')(),
	expressConfig = require('./config/config').config(app, express),// Configuración
	io 		= require('socket.io')(http),							// Socket IO
	net 	= require('net'),										// Socket Arduino
	arduino = require('./Arduino')(),								// ArduinoModule
	DataStore	= require('./config/db')(app, expressConfig);		// Conexión
	require('./controllers')(app);									// Controladores

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

	//Socket.IO CLIENTE
	io.on('connection', function(socket)
	{
		//Paso el handler del socket del usuario
		//para emitir errores directamente
		arduino.socketClient = socket;

		//Configuracion
		arduino.init();

		programadorTareas.socketClient = socket;

		//Escucha evento para obtener listado de luces encendidas
		//no se provoca el broadcast
		socket.on('getSalidasActivas', function(params)
		{
			sendSalidasActivas(params, false);
		});

		//Envia listado de salidas activas al cliente
		//broadcast = true actualiza la vista de luces encendidas a todos los
		//sockets conectados
		var sendSalidasActivas = function(params, broadcast) {
			var salidasAux = [];
			var sockets = [];
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
					if (broadcast) {
						socket.broadcast.emit('salidasActivas', []);
					}
					else {
						socket.emit('salidasActivas', []);
					}
					salidasState.salidas = [];
					salidasState.updateTimeStamp();
				});

				sockets[key].on('data',function(_data)

				{
					item.buffer+= _data;
				});

				//Si fallo la conexión, aviso al cliente con un array nulo
				sockets[key].on('error',function(_err)
				{
					if (broadcast) {
						socket.broadcast.emit('salidasActivas', []);
					}
					else {
						socket.emit('salidasActivas', []);
					}
					salidasState.salidas = [];
					salidasState.updateTimeStamp();
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

						if (broadcast) {
							socket.broadcast.emit('salidasActivas',uniqueEncendidas);
						}
						else {
							socket.emit('salidasActivas', uniqueEncendidas);
						}
						salidasState.salidas = ArrayUtils.unique(encendidasF);
						salidasState.updateTimeStamp();
					}
				});
			});
		}
		//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
		socket.on('getSalidas', function(params)
		{
			sendSalidas(params);
		});

		var sendSalidas = function( params ) {
			params.noError = true;
			var dispositivo = DataStore.findDispositivo('id_disp',params.id_disp);

			if (dispositivo.length > 0)
			{
				arduino.getSalidas(params, function(salidas)
				{
					var salidas = ArrayUtils.mixArrays(dispositivo[0].salidas, salidas);
					dispositivo[0].salidas = salidas;
					if (params.broadcast) {
						socket.broadcast.emit('salidas', dispositivo[0]);
					}
					else {
						socket.emit('salidas', dispositivo[0]);
					}
				});
			}
		}

		//Sube,baja o detiene las persianas
		socket.on('movePersiana', function(params)
		{
			arduino.movePersiana(params, function(response)
			{
				socket.emit('moveResponse', response);
			});
		});

		//Envia broadcast para actualizar la vista de luces encendidas
		//si pasaron 5 segundos desde la ultima accion sobre una salida
		var broadcastSalidasState = function(params) {

			//chequea cada 1 segundo si es momento de hacer broadcast
			intervalo = setInterval (function() {
				if ((salidasState.timestamp + 5000) > new Date().getTime()) {
					/*console.log("Faltan ", new Date().getTime()-(salidasState.timestamp
								+ 5000) +" ms para el broadcast")*/
				}
				else {
					//refresca pagina luces encendidas
					sendSalidasActivas(params, true);

					//refresca pagina salidas de dispositivo
					sendSalidas(params, true);

					clearInterval(intervalo);
				}
			},1000);
		}

		//Setea el estado de una salida, ON/OFF
		socket.on('switchSalida', function(params)
		{
			//Si habia una peticion de broadcast, la elimina
			if (intervalo) clearInterval(intervalo);
			timeout = new Date().getTime();
			params.noError = true;
			salidasState.timestamp = new Date().getTime();
			arduino.switchSalida(params, function(response)
			{
				broadcastSalidasState(params);

				socket.emit('switchResponse',
							(response === null) ? params.estado_orig : response);

			});
		});
	});
});