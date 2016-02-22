var net = require('net');

module.exports = function()
{
	var Socket =
	{
		socketClient: {},
		_socket: {},
		client: {},
		errors: {
				"ENOTFOUND": "No se encontró dispositivo en el socket solicitado: ",
				"EHOSTUNREACH": "Dispositivo no alcanzado",
				"ECONNREFUSED": "Conexión rechazada: Chequea la IP y puerto ",
				"TIMEOUT": "Se alcanzó el tiempo de espera límite para la conexión!"
		},
		//Conexion al socket arduino
		connect: function(params, callback)
		{
			var timer, This = this;
			timeout = 250;

			timer = setTimeout(function()
			{
				if (!params.noError)
				{
					This.socketClient.emit('Error', This.errors['TIMEOUT']);
				}
				else
				{
					callback(0);
				}
			}, timeout);

			var client = net.connect(
			{
				host: params.ip,
				port: 8000
			},function()
			{
				clearTimeout(timer);
				callback(1, client)
			});

			client.on('error', function(err)
			{
				if (params.noError)
				{
					callback();
				}
				else
				{
					This.socketClient.emit('Error', This.errors[err.code]);
				}
			})

		},
		//Envia comando al socket. Viene en params.command
		send: function(params, callback)
		{
			var This = this;
			params.ip = params.ip || params.ip_dispositivo;
			if (params.ip)
			{
				this.connect(params, function(response, socket)
				{
					This.data = "";
					if (response == 1)
					{
						socket.write(params.command);
						socket.on('data', function(_data)
						{
							if (params.decorator)
							{
								params.decorator(_data.toString())
							}
							else
							{
								This.data = _data.toString();
							}
						});
						socket.on('end', function()
						{
							callback(This.data);
						});
					}
					else
					{
						callback(null);
					}
				});
			}
		},
	}
	return Socket;
}

