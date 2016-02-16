var net = require('net');

module.exports = function()
{
	var Socket =
	{
		socketClient: {},
		client: {},
		//Conexion al socket arduino
		connect: function(params, callback)
		{
			var timer, This = this;
			timeout = 1000;
			console.log("[INFO] Conectando al socket: " + params.ip + ":8000");
			this.client = net.connect(
			{
				host: params.ip,
				port: 8000
			},function()
			{
				clearTimeout(timer);
				callback(1);
			});
			timer = setTimeout(function()
			{
				if (!params.noError)
				{
					This.socketClient.emit('Error', "Se alcanzó el tiempo de espera límite para la conexión!");
				}
				else
				{
					callback(0);
				}
			}, timeout);

			this.client.on('error', function(err)
			{
				clearTimeout(timer);
				if (err.code == "ENOTFOUND")
				{
					if (!params.noError)
					{
						This.socketClient.emit('Error', "No se encontró dispositivo en el socket solicitado: " + err);
					}
					else
					{
						This.socketClient.emit('connected', 1);
						callback();
					}
					return;
				}

				if (err.code == "ECONNREFUSED")
				{
					if (!params.noError)
					{
						This.socketClient.emit('Error', "Conexión rechazada: Chequea la IP y puerto ");
					}
					else
					{
						callback();
					}
					return;
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
				this.connect(params, function(response)
				{
					console.log("Conexion", response);
					if (response == 1)
					{
						This.client.write(params.command);
						This.client.on('data', function(_data)
						{
							console.log("DATA",_data);
							if (params.decorator)
							{
								params.decorator(_data.toString())
							}
							else
							{
								This.data = _data.toString();
							}
						});
						This.client.on('end', function()
						{
							callback(This.data);
						});
					}
					else
					{
						callback("");
					}
				})
			}
		},
	}
	return Socket;
}

