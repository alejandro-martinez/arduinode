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

//Server HTTP
http.listen(app.get('port'), function()
{
	console.log('Servidor corriendo en: ' + app.get('port'));

	//Socket.IO CLIENTE
	io.on('connection', function(socket)
	{
		//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
		socket.on('getSalidas', function(params)
		{
			arduino.getSalidas(params,function(_salidas)
			{
				//Traigo las descripciones de las salidas, (si existen)
				sequelize.models.dispositivos.getSalidas(params.id_disp,
				function(models)
				{
					models.forEach(function(x, i)
					{
						_salidas.filter(function(s, j,salidas)
						{
							if (s.nro_salida == x.nro_salida)
							{
								s.note = x.note;
							}
						});
					});
				});
				params.salidas = _salidas;

				//Consulto los estados(ON/OFF) de cada salida
				arduino.getEstados(params, function(data)
				{
					socket.emit('salidas', data);
				});
			});
		});

		//Intercambia el estado de una salida, ON/OFF
		socket.on('toggleSalida', function(params)
		{
			arduino.toggleSalida(params, function(response)
			{
				console.log("Resp toggle",response);
				socket.emit('responseToggle', response);
			});
		});
	});
});