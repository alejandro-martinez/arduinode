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
http.listen(9500, function()
{
	console.log('Servidor corriendo en: ' + app.get('port'));
	//Socket.IO CLIENTE
	io.on('connection', function(socket)
	{
		process.on('uncaughtException', function (err)
		{
			socket.emit('Error', err)
		});
		socket.on('getEstados', function(_salidas)
		{
			//Consulto los estados(ON/OFF) de cada salida
			arduino.getEstados({salidas: _salidas}, function(data)
			{
				socket.emit('estados', data);
			});
		});
		//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
		socket.on('getSalidas', function(params)
		{
			arduino.getSalidas(params, function(response, err)
			{
				if (err)
				{
					socket.emit('Error', err);
				}
				else
				{
					//Traigo las descripciones de las salidas, (si existen)
					sequelize.models.dispositivos.getSalidas(params.id_disp,
					function(models)
					{
						models.forEach(function(x, i)
						{
							response.filter(function(s, j)
							{
								if (s.nro_salida == x.nro_salida)
								{
									s.note = x.note;
								}
							});
						});
					});
					params.salidas = response;

					//Consulto los estados(ON/OFF) de cada salida
					arduino.getEstados(params, function(data)
					{
						console.log(data);
						if (params.estado == 'lucesOn')
						{
							var lucesEncendidas = data.filter(function(s)
							{
								return s.estado == 'on';
							})
							socket.emit('salidas', lucesEncendidas);
						}
						else
						{
							socket.emit('salidas', data);
						}
					});
				}
			});
		});
		//Sube,baja o detiene las persianas
		socket.on('movePersiana', function(params)
		{
			arduino.movePersiana(params, function(response, err)
			{
				if (err)
				{
					socket.emit('Error', err);
				}
				else
				{
					socket.emit('moveResponse', response);
				}
			});
		});
		//Intercambia el estado de una salida, ON/OFF
		socket.on('toggleSalida', function(params)
		{
			arduino.toggleSalida(params, function(response, err)
			{
				if (err)
				{
					socket.emit('Error', err);
				}
				else
				{
					console.log("EEEE",response);
					if (response == 1 || response == 0)
					{
						socket.emit('toggleResponse', response);
					}
				}

			});
		});
	});
});