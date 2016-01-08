var net = require('net');

module.exports = function()
{
	var Socket =
	{
		client: {},
		//Conexion al socket arduino
		connect: function(params, callback)
		{
			this.client = net.connect(
			{
				host: params.ip,
				port: 8000
			},function()
			{
				callback();
			});
		},
		//Envia comando al socket. Viene en params.command
		send: function(params, callback)
		{
			var This = this;
			if (params.ip)
			{
				console.log("Envia comando",params.command,"a ",params.ip);
				this.connect(params, function()
				{
					This.client.write(params.command);
					This.client.on('data', function(_data){
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
				})
			}
		},
		//Consulta el estado de una salida en particular
		getEstadoSalida: function(params, callback)
		{
			var This = this;
			this.data = "";
			params.command = 'S'+params.salida;
			this.send(params, function()
			{
				callback( This.data );
			});
		},
		//Intercambia el estado de una salida (Si está en ON, la pasa a OFF y viceversa)
		toggleSalida: function(params, callback)
		{
			var This = this;
			this.data = "";
			params.command = 'T'+params.salida;
			this.send(params, function()
			{
				callback( This.data );
			});
		},
		//Devuelve listado de salidas de una placa
		getSalidas: function(params,callback)
		{
			var This = this;
			this.data = "";
			this.salidas = [];
			params.command = 'G';
			params.decorator = function(_data)
			{
				for (var i=0; i < _data.length; i+= 2)
				{
					This.salidas.push(_data[i] + _data[i + 1]);
				}
			}
			this.send(params, function()
			{
				delete params.decorator;
				callback( This.salidas );
			});
		},
		//Devuelve estados de cada salida del array pasado por parametro
		getEstados: function(params, callback)
		{
			var This = this;
			This.estados = [];

			//Por cada salida, consulto su estado
			var i = 0;
			var loop = function(nro_salida)
			{
				if (i < params.salidas.length)
				{
					params.salida = params.salidas[i];
					This.getEstadoSalida(params, function(e)
					{
						This.estados.push({
							note: params.salidas[i],
							nro_salida: params.salidas[i],
							estado: (e == 1) ? 'on' : 'off',
							id_disp: params.id_disp
						})
						loop(i++);
					});
				}
				else
				{
					callback(This.estados);
				}
			}
			loop(i);
		}
	}
	return Socket;
}
