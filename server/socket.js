var net = require('net');
module.exports = function()
{
	var Socket =
	{
		socketCliente: {},
		socketServidor: {},
		connect: function()
		{
			this.socketServidor = net.connect(
			{
				host: '192.168.2.200',
				port: 8000
			}, function()
			{
				console.log("conexion exi");
				this.socketServidor.on('data', function(data)
				{
					console.log(data.toString());
					this.socketCliente.emit('data', data.toString());
				});
			});

			this.socketServidor.on('end', function()
			{
				console.log('Desconectado');
			});

			return this;
		},
		listen: function(callback)
		{
			console.log("listen");
			//Recibo data del socket Arduino
			this.socketServidor.on('data', function(data)
			{
				console.log(data.toString());
				this.socketCliente.emit('data', data.toString());
			});
		},
		send: function(param)
		{
			console.log(param);
			//envio datos al socket Arduino
			this.socketServidor.write(param);
		}
	}
	return Socket;
}
