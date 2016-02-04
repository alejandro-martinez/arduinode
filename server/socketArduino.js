var socket = require('./socket')(),
	async = require('async'),
	DateConvert = require('./utils/DateConvert')();
module.exports = function()
{
	var Arduino =
	{
		socketClient: {},
		init: function()
		{
			socket.socketClient = this.socketClient;
		},
		// Setea el estado de una salida en ON u OFF
		switchSalida: function(params, callback)
		{
			console.log("params ardu",params);
			var This = this;
			this.data = "";
			params.command = 'T'.concat(params.nro_salida, params.estado, params.timeout || "");
			params.decorator = function(_data)
			{
				This.data+= _data;
			}
			socket.send(params, function( response )
			{
				callback( This.data );
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
			socket.send(params, function(response)
			{
				if (This.data.length > 0)
				{
					delete params.decorator;

					var salidasRaw = This.data.match(/[^\r\n]+/g);
					This.found;
					var salidas = [];
					salidasRaw.forEach(function(s)
					{
						var posGuion = s.indexOf("-"),
							posDospuntos = s.indexOf(":"),
							posPunto = s.indexOf(".");
						switch (s[0])
						{
							case 'B':
							case 'L':
							case 'P':
								var nro_salida = s[posGuion+1] + s[posGuion+2],
									estado = s[posDospuntos+1],
									tipo = s[0],
									temporizada = DateConvert.min_a_horario(s.substr( posPunto + 1));
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
								ip: params.ip,
								temporizada: temporizada
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
				else
				{
					callback([]);
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
			socket.send(params, function( response )
			{
				delete params.decorator;
				callback( This.data );
			});
		}
	}
	return Arduino;
}
