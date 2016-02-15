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
	config 	= require('./config/config').config(app, express),	// Configuración
	io 		= require('socket.io')(http),						// Socket IO
	net 	= require('net'),									// Socket Arduino
	arduino = require('./socketArduino')(),						// ArduinoModule
	db 		= require('./config/db')(app, config);					// Conexión
	require('./models')(app);									// Modelos
	require('./controllers')(app);								// Controladores

//Server HTTP
http.listen(app.get('port'), function()
{
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

		//Devuelve lista de salidas activas (con estado == 'on' (0))
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
					socket.emit('salidasActivas', salidas);
				});
			})
		});

		//Devuelve las salidas de un dispositivo con sus descripciones
		var getSalidas = function(params, callback)
		{
			var dispositivo = DataStore.findDispositivo('id_disp',1);

			arduino.getSalidas(params, function(response)
			{


				console.log("Obj",obj);
				params.salidasDB = obj;
				params.salidasArduino = response;
				//callback( sequelize.models.salidas.addNotes(params), models );
				callback( obj, response );
			});
		}

		//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
		socket.on('getSalidas', function(params)
		{
			params.noError = true;
			var dispositivo = DataStore.findDispositivo('id_disp',1);
			if (dispositivo.length > 0)
			{
				socket.emit('salidas', dispositivo[0].salidas);
			}


			/*
			getSalidas(params, function(response, models)
			{
				var resp;
				if (response.length == 0)
				{
					models.push({error: "Dispositivo sin Conexión"});
					resp = models
				}
				else
				{
					resp = response;
				}
				socket.emit('salidas', resp);
			});*/
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
					arduino.getSalidas({noError:true, ip: ip}, function(salidasDisp)
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
					socket.emit('salidasPlanta', models[0]);
				});
			});
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
			arduino.switchSalida(params, function(response)
			{
				if (response == 1 || response == 0)
				{
					socket.emit('switchResponse', response);
				}
			});
		});
	});
});