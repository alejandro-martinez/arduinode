var socket = require('./socket')();

module.exports = function()
{
	var Arduino =
	{
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
			socket.send(params, function(response, err)
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
		getSalidasActivas: function(params, callback)
		{
			var This = this;
			This.salidasActivas = [];
			var i = 0;
			exit = 0;
			var cant_dispositivos = params.length
			var loop = function(i)
			{
				console.log("I",i);
				if ( i < cant_dispositivos)
				{
					This.getSalidas({
						noError: true,
						ip: params[i].ip,
						id_disp:  params[i].id_disp
					},
					function(e)
					{

						i++;
						console.log("pidoactivas",e);
						params.salidas = e;
						params.noError= true;
						params.ip = params[i].ip;
						This.getLucesActivas(params, function(estados)
						{
							This.salidasActivas.push(estados);
							console.log("traigo")

							loop(i);
						});

					});
				}
			}
			if (i ==0)
				loop(i);
			if (i > cant_dispositivos)
			{
				console.log("ASDASD");
				callback(This.salidasActivas);
			}

		},
		getSalidasActivas: function(params, callback)
		{
			var This = this;

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
					params.ip = params.ip || params.salida.ip;
					This.getEstadoSalida(params, function(e)
					{
						params.salidas[i].estado = (e == 1) ? 'on' : 'off';
						params.salidas[i].id_disp = params.salida.id_disp;
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
			socket.send(params, function( response, err )
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
			socket.send(params, function(response, err)
			{
				delete params.decorator;
				if (err == "inactive")
				{
					callback(null);
				}
				else if (err)
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
			socket.send(params, function( response, err )
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
	return Arduino;
}
