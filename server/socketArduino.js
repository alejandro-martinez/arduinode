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
			timeout = 15000;
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
				callback(null, "Se alcanzó el tiempo de espera límite para la conexión!");
			}, timeout);

			this.client.on('error', function(err) {
				clearTimeout(timer);
				if (err.code == "ENOTFOUND") {
					callback(null, "No se encontró dispositivo en el socket solicitado: " + err);
					return;
				}

				if (err.code == "ECONNREFUSED") {
					callback(null, "Conexión rechazada: Chequea la IP y puerto ");
					return;
				}
			})
		},
		//Envia comando al socket. Viene en params.command
		send: function(params, callback)
		{
			console.log("Comando",params.command);
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
							console.log(_data.toString());
							if (params.decorator)
							{
								params.decorator(_data.toString())
							}
							else
							{
								console.log("la data es:",_data.toString());
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
		//Consulta el estado de una salida en particular
		getEstadoSalida: function(params, callback)
		{
			var This = this;
			this.data = "";
			params.decorator = function(_data)
			{
				This.data+= _data;
			}
			params.command = 'S'+params.salida.nro_salida;
			this.send(params, function(response, err)
			{
				delete params.decorator;
				if (err)
				{
					callback(null, err);
				}
				else
				{
					callback( This.data );
				}
			});
		},
		// Intercambia el estado de una salida
		// (Si está en ON, la pasa a OFF y viceversa)
		toggleSalida: function(params, callback)
		{
			var This = this;
			this.data = "";
			params.command = 'T'+params.salida;
			params.decorator = function(_data)
			{
				This.data+= _data;
			}
			this.send(params, function( response, err )
			{
				if (err)
				{
					callback(null, err);
				}
				else
				{
					callback( This.data );
				}
			});
		},
		buscarSalida: function(salidas, nro)
		{
			return salidas.filter(function(s)
			{
				return s.nro_salida == nro;
			})
		},
		//Devuelve listado de salidas de una placa
		getSalidas: function(params,callback)
		{
			var This = this;
			this.data = "";
			params.command = 'G';
			params.decorator = function(_data)
			{
				This.data+= _data;
			}
			this.send(params, function(response, err)
			{
				delete params.decorator;
				if (err)
				{
					callback(null, err);
				}
				else
				{
					var salidasRaw = This.data.match(/[^\r\n]+/g);

					var salidas = [];
					salidasRaw.forEach(function(s)
					{
						var posGuion = s.indexOf("-") + 1;
						switch (s[0])
						{
							case 'L':
								for (var i = posGuion; i < s.length; i+=2)
								{
									var nro = s[i].concat(s[i + 1]);
								}
								break;

							case 'P':
								var nro = s[posGuion].concat(s[posGuion + 1])
								break;
						}
						var found = This.buscarSalida(salidas, nro);
						if (found.length == 0 )
						{
							salidas.push({
								nro_salida: nro,
								note: s[0] + "-" +  nro,
								tipo: s[0],
								estado: "",
								id_disp: ""
							});
						}
					});
					callback( salidas );
				}
			});
		},
		//Devuelve estados de cada salida del array pasado por parametro
		getEstados: function(params, callback)
		{
			var This = this;
			//Por cada salida, consulto su estado
			var i = 0;
			var loop = function(nro_salida)
			{
				if (i < params.salidas.length)
				{
					params.salida = params.salidas[i];
					This.getEstadoSalida(params, function(e)
					{
						console.log("Estado",e);
						params.salidas[i].estado = (e == 1) ? 'on' : 'off';
						params.salidas[i].id_disp = params.id_disp;
						loop(i++);
					});
				}
				else
				{
					callback(params.salidas);
				}
			}
			loop(i);
		},
		//Sube, baja o detiene la persiana.. params.action = 0, 1 o 2
		movePersiana: function(params, callback)
		{
			var This = this;
			this.data = "";
			params.command = 'P'+params.nro_salida+params.action;
			params.decorator = function(_data)
			{
				This.data+= _data;
			}
			this.send(params, function( response, err )
			{
				delete params.decorator;
				if (err)
				{
					callback(null, err);
				}
				else
				{
					callback( This.data );
				}
			});
		}
	}
	return Socket;
}
