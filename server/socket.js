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
		connect: function(ip, callback)
		{
			var socket = new net.Socket();
			socket.setTimeout(1000);
			socket.connect(8000, ip, function(response)
			{
				callback(1, socket)
			})
			socket.on('timeout',function(_err)
			{
				console.log("Timeout",_err)
			});
		},
		//Envia comando al socket. Viene en params.command
		send: function(params, callback)
		{
			var This = this;
			This.data = "";
			if (params.ip)
			{
				this.connect(params.ip, function(response, socket){

					if (response) {
						socket.write(params.comando);
						console.log("Comando",params)
						socket.on('data',function(_data)
						{
							This.data+= _data.toString();
						});

						socket.on('end', function()
						{
							callback(This.data);
						});
					}
					else {
						callback();
					}
				});
			}
		},
	}
	return Socket;
}

