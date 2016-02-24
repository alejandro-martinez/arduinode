'use strict';

//Dependencias
var express = require('express'),
	app 	= express(),
	fs		= require('fs'),
	compress = require('compression');
	app.use(compress());
	var http 	= require('http').Server(app),
	programadorTareas = require('./config/programadorTareas'),
	ArrayUtils = require('./utils/ArrayUtils')(),
	config 	= require('./config/config').config(app, express),	// Configuración
	io 		= require('socket.io')(http),						// Socket IO
	net 	= require('net'),									// Socket Arduino
	arduino = require('./Arduino')(),							// ArduinoModule
	DataStore	= require('./config/db')(app, config);			// Conexión
	require('./models')(app);									// Modelos
	require('./controllers')(app);								// Controladores

//Server HTTP
http.listen(app.get('port'), function()
{
	//Abre el archivo json, y cargo campos temporales
	DataStore.getFile('dispositivos',function()
	{
		DataStore.updateDispositivo();
		//Carga tareas en scheduler
		programadorTareas.importar();
	});

	console.log('Servidor corriendo en: ' + app.get('port'));

	//Socket.IO CLIENTE
	io.on('connection', function(socket)
	{
		//Captura excepciones para no detener el servidor
		process.on('uncaughtException', function (err)
		{
			console.log(err)
		});

		//Paso el handler del socket del usuario
		//para emitir errores directamente
		arduino.socketClient = socket;

		//Configuracion
		arduino.init();

		//Devuelve lista de salidas activas (con estado == 0
		socket.on('getSalidasActivas', function()
		{
			this.salidasAux = [];
			var params = {
				noError: true,
				ip: '192.168.20.8',
				id_disp: 8
			}
			var sockets = [];
			DataStore.currentFile.forEach(function(item, key)
			{
				var salidas,
				encendidas = [],
				params = {
					noError: true,
					ip: item.ip,
					id_disp: item.id_disp,
					filterByEstado: '0'
				}
				sockets[key] = new net.Socket();
				sockets[key].connect(8000, item.ip, function(response)
				{
					item.connectSuccess = true;
					sockets[key].write('G')
				})
				sockets[key].on('data',function(_data)
				{
					item.buffer+= _data;
				});
				sockets[key].on('error',function(_err)
				{
					console.log("Error al conectarse a", item.ip);
				});
				sockets[key].on('end',function()
				{
					//Transformo el buffer en un aray
					item.buffer = item.buffer.split('\r\n');
					//Remueve el ultimo elemento porque viene vacio
					item.buffer.pop();

					if (item.buffer.length > 0 && item.connectSuccess)
					{
						//Reccorro buscando los encendidos
						item.buffer.forEach( function( i ) {
							if (i.indexOf( ':0' ) > 0 ){
								encendidas.push( i )
							}
						});

						params.salidasOrig = item.salidas;
						item.buffer = "";
						socket.emit('salidasAux', arduino.formatSalidas(params,encendidas));
					}
				});
			});
		});

		//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
		socket.on('getSalidas', function(params)
		{
			params.noError = true;
			var dispositivo = DataStore.findDispositivo('id_disp',params.id_disp);

			if (dispositivo.length > 0)
			{
				arduino.getSalidas(params, function(salidas)
				{
					var salidas = ArrayUtils.mixArrays(dispositivo[0].salidas, salidas);
					dispositivo[0].salidas = salidas;
					socket.emit('salidas', dispositivo[0]);
				});
			}
		});

		//Sube,baja o detiene las persianas
		socket.on('movePersiana', function(params)
		{
			arduino.movePersiana(params, function(response)
			{
				socket.emit('moveResponse', response);
			});
		});

		//Setea el estado de una salida, ON/OFF
		socket.on('switchSalida', function(params)
		{
			params.noError = true;
			arduino.switchSalida(params, function(response)
			{
				socket.emit('switchResponse',
							(response === null) ? params.estado_orig : response);

			});
		});
	});
});