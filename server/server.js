//Dependencias
var express = require('express'),
	app = express(),
	fs = require('fs'),
	http = require('http').Server(app),
	config = require('./config/config').config(app, express),	// Configuración
	io = require('socket.io')(http),							// Socket IO
	net = require('net'),										// Socket Arduino
	db = require('./config/db')(config);						// Conexión
	require('./models')(app);									// Modelos
	require('./controllers')(app);								// Controladores

var socketArduino =
{
	client: {},
	socket: {},
	connect: function(callback)
	{
		var This = this;
		this.client = net.connect({
			host: '192.168.2.200',
			port: 8000
		},function() {
			callback(this);
		});
	},
	send: function(param, callback)
	{
		this.client.write(param);
		this.client.on('end',function()
		{
			callback(this.data);
		});
	},
	getEstadoSalida: function(nro_salida, callback)
	{
		var This = this;
		this.data = "";
		this.connect(function(socket)
		{
			socket.on('data', function(_data) {
				This.data = _data.toString();
			});

			This.send('S'+nro_salida, function(estado)
			{
				callback( This.data );
			});
		});
	},
	getSalidas: function(callback)
	{
		var This = this;
		this.data = "";
		this.salidas = [];
		this.connect(function(socket)
		{
			socket.on('data', function(_data) {
				This.data += _data.toString();
			});

			This.send('G', function(salidas)
			{
				for (i=0; i < This.data.length; i+= 2)
				{
					This.salidas.push(This.data[i] + This.data[i + 1]);
				}
				callback( This.salidas );
			});
		});
	}
}

//Server listener para Usuarios
http.listen(app.get('port'), function()
{
	console.log('Servidor corriendo en: ' + app.get('port'));


	//Socket listener
	io.on('connection', function(socket)
	{
		socket.on('getSalidas', function()
		{
			//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
			socketArduino.getSalidas(function(salidas)
			{
				var This = this;
				This.response = [];

				//Por cada salida, consulto su estado
				var i = 0;
				var loopGetEstadosSalida = function(nro_salida)
				{
					if (i <= salidas.length)
					{
						socketArduino.getEstadoSalida(salidas[i], function(e)
						{
							This.response.push({
								salida: salidas[i],
								estado: (e == 1) ? 'on' : 'off'
							})
							loopGetEstadosSalida(i++);
						});
					}
					else
					{
						socket.emit('salidas', This.response);
					}
				}
				loopGetEstadosSalida(i);
			});
		});
		socket.on('toggleSalida', function(nro_salida)
		{
			console.log(nro_salida);
			//Devuelve el listado de salidas del dispositivo con sus estados (ON OFF)
			socketArduino.getSalidas(function(salidas)
			{
			}
		});

	});
});