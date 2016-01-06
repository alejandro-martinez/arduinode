'use strict';
//Dependencias
var express = require('express'),
	app 	= express(),
	fs		= require('fs'),
	http 	= require('http').Server(app),
	config 	= require('./config/config').config(app, express),	// Configuración
	io 		= require('socket.io')(http),						// Socket IO
	net 	= require('net'),									// Socket Arduino
	arduino = require('./socketArduino')(),						// ArduinoModule
	db 		= require('./config/db')(config);					// Conexión
	require('./models')(app);									// Modelos
	require('./controllers')(app);								// Controladores

//Server listener para Usuarios
http.listen(app.get('port'), function()
{
	console.log('Servidor corriendo en: ' + app.get('port'));

	//Socket listener
	io.on('connection', function(socket)
	{
		socket.on('getSalidas', function(_ip)
		{
			var params = {ip: _ip}

			//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
			arduino.getSalidas(params,function(salidas)
			{
				params.salidas = salidas;
				arduino.getEstados(params, function(estados)
				{
					socket.emit('salidas', estados);
				});

			});
		});
		socket.on('toggleSalida', function(params)
		{
			//Intercambia el estado de una salida, ON/OFF
			arduino.toggleSalida(params, function(response)
			{
				socket.emit('toggleSalida', response);
			});
		});

	});
});