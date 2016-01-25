'use strict';
//Dependencias
var express = require('express'),
	app 	= express(),
	fs		= require('fs'),
	async	= require('async'),
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
		process.on('uncaughtException', function (err)
		{
			//socket.emit('Error', err)
		});

		socket.on('getSalidasActivas', function()
		{
			var salidas = [];
			sequelize.models.dispositivos.findAll().then(function(models)
			{
				async.eachSeries(models, function iterator(item, callback)
				{
					getSalidas({
						noError: true,
						ip: item.ip,
						id_disp: item.id_disp,
						filterByEstado: 'on'
					},
					function(response)
					{
						salidas = salidas.concat(response);
						callback(null, item);
					});

				}, function done()
				{
					console.log("fin");
					socket.emit('salidasActivas', salidas);
				});
			})
		});

		//Devuelve las salidas de un dispositivo con notas
		var getSalidas = function(params, callback)
		{
			console.log(params);
			arduino.getSalidas(params, function(response, err)
			{
				if (err)
				{
					(params.noError) ? callback() : socket.emit('Error', err);
				}
				else
				{
					sequelize.models.dispositivos.getSalidas(params.id_disp,
					function(models)
					{
						params.salidasDB = models;
						params.salidasArduino = response;
						callback( sequelize.models.salidas.addNotes(params) );
					});
				}
			});
		}

		//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
		socket.on('getSalidas', function(params)
		{
			getSalidas(params, function(response)
			{
				socket.emit('salidas', response);
			});
		});

		//Devuelve el listado de salidas de una planta específica
		socket.on('getSalidasPlanta', function(id_planta)
		{
			var salidasPlanta = [];

			sequelize.models.salidas.getByPlanta(id_planta,
			function(models)
			{
				var dispositivosUnique = [];

				models[0].forEach(function(d)
				{
					if (dispositivosUnique.indexOf(d.ip) == -1)
					{
						dispositivosUnique.push(d.ip);
					}
				});
				async.eachSeries(dispositivosUnique, function iterator(ip, callback)
				{
					arduino.getSalidas({ip: ip}, function(salidasDisp, err)
					{
						if (err)
						{
							socket.emit('Error', err);
						}
						else
						{
							salidasDisp.forEach(function(s,i)
							{
								models[0].filter(function(m,j)
								{
									if (m.ip == ip)
									{
										if (s.nro_salida == m.nro_salida)
										{
											m.estado = s.estado;
											m.tipo = s.tipo;
										}
									}
								});
							})

							callback(null, ip);
						}
					})
				},
				function done()
				{
					models[0].filter(function(s)
					{
						if (typeof s.estado == "undefined")
						{
							s.estado = "error";
						}
					});
					console.log(models[0]);
					socket.emit('salidasPlanta', models[0]);
				});
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
					console.log("resp persiana",response);
					socket.emit('moveResponse', response);
				}
			});
		});
		//Intercambia el estado de una salida, ON/OFF
		socket.on('switchSalida', function(params)
		{
			arduino.switchSalida(params, function(response, err)
			{
				if (err)
				{
					socket.emit('Error', err);
				}
				else
				{
					if (response == 1 || response == 0)
					{
						socket.emit('switchResponse', response);
					}
				}

			});
		});
	});
});