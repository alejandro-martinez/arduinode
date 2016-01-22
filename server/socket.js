var net = require('net');


module.exports = function()
{
	var Socket =
	{
		client: {},
		//Conexion al socket arduino
		connect: function(params, callback)
		{
			var timer;
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
					callback(null, "Se alcanzó el tiempo de espera límite para la conexión!");
				}
				else
				{
					callback(null, "inactive");
				}
			}, timeout);

			this.client.on('error', function(err)
			{
				clearTimeout(timer);
				if (err.code == "ENOTFOUND")
				{
					if (!params.noError)
					{
						callback(null, "No se encontró dispositivo en el socket solicitado: " + err);
					}
					else
					{
						callback(null, "inactive");
					}
					return;
				}

				if (err.code == "ECONNREFUSED")
				{
					if (!params.noError)
					{
						callback(null, "Conexión rechazada: Chequea la IP y puerto ");
					}
					else
					{
						callback(null, "inactive");
					}
					return;
				}
			})
		},
		//Envia comando al socket. Viene en params.command
		send: function(params, callback)
		{
			var This = this;
			if (params.ip)
			{
				this.connect(params, function(response, err)
				{
					if (err)
					{
						callback(null, err);
					}
					else
					{
						This.client.write(params.command);
						This.client.on('data', function(_data)
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
						This.client.on('end', function()
						{
							callback(This.data);
						});
					}
				})
			}
		},
	}
	return Socket;
}

