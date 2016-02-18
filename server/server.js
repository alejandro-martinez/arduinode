'use strict';

//Dependencias
var express = require('express'),
	app 	= express(),
	fs		= require('fs'),
	async	= require('async'),
	compress = require('compression');
	app.use(compress());
	var http 	= require('http').Server(app),
	programadorTareas = require('./programadorTareas'),
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
	});

	console.log('Servidor corriendo en: ' + app.get('port'));

	//Carga tareas en scheduler
	//programadorTareas.importar();

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
				id_disp: 8,
				filterByEstado: '0'
			}
			DataStore.currentFile.forEach(function(item)
			{
				var params = {
					noError: true,
					ip: item.ip,
					id_disp: item.id_disp,
					filterByEstado: '0'
				}
				arduino.getSalidas(params, function(response)
				{
					socket.emit('salidasAux', response);
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