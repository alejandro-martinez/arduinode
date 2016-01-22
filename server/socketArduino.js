var socket = require('./socket')();
var async = require('async');
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
		getEstados: function(params, callback)
		{
			var This = this;
			var i = 0;
			var salidas = [];
			var loop = function()
			{
				if (i < params.salidas.length)
				{
					This.getSalidas({ ip: params[i].ip }, function(salidas)
					{
						salidas.id_disp = params[i].id_disp;
						salidas.push(salidas);
						loop(i++);
					})
				}
				else
				{
					callback(params.salidas);
				}
			}
			loop(i);
		},
		// Setea el estado de una salida en ON u OFF
		switchSalida: function(params, callback)
		{
			var This = this;
			this.data = "";
			params.command = 'T' + params.nro_salida + params.estado;
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
		buscarSalida: function(params, found)
		{
			if (params.salidas.length > 0)
			{
				async.forEach(params.salidas, function iterator(s, callback)
				{
					if (parseInt(s.nro_salida) == params.nro_salida)
					{
						if (s.ip == params.ip)
						{
							return found(true);
						}
					}
					callback(null, s);

				}, function done()
				{
					return found(false);
				});
			}
			else
			{
				return found(false);
			}
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
					This.found;
					var salidas = [];
					salidasRaw.forEach(function(s)
					{
						var posGuion = s.indexOf("-");
						var posDospuntos = s.indexOf(":");
						switch (s[0])
						{
							case 'B':
							case 'L':
							case 'P':
								var nro_salida = s[posGuion+1] + s[posGuion+2];
								var estado = s[posDospuntos+1];
								var tipo = s[0];
								break;
							default:
								return;
						}
						var uniques = [];
						var _params =
						{
							salidas: salidas,
							nro_salida: parseInt(nro_salida),
							ip: params.ip,
							tipo: tipo
						}
						This.buscarSalida(_params, function(_found)
						{
							This.found = _found;
						});
						if (!This.found)
						{
							salidas.push({
								nro_salida: nro_salida,
								note: params.ip.concat("-",tipo,nro_salida),
								tipo: tipo,
								estado: (estado == 0) ? "on" : "off",
								id_disp: "",
								ip: params.ip
							});
						}

					});
					if (typeof params.filterByEstado != 'undefined' )
					{
						var salidasA = salidas.filter(function(s)
						{

							return s.estado == params.filterByEstado;
						})
					}
					callback( salidasA || salidas);
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
