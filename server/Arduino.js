var socket = require('./socket')(),
	async = require('async'),
	DateConvert = require('./utils/DateConvert')();

module.exports = function()
{
	var Arduino =
	{
		socketClient: {},
		sockets: [],
		init: function()
		{
			socket.socketClient = this.socketClient;
		},
		// Setea el estado de una salida en ON u OFF
		switchSalida: function(params, callback)
		{
			var This = this;
			if (params.temporizada != undefined)
			{
				params.temporizada = DateConvert.horario_a_min(params.temporizada);
			}
			this.data = "";
			params.command = 'T'.concat(params.nro_salida, params.estado, ".", params.temporizada || "");
			params.decorator = function(_data)
			{
				This.data+= _data;
			}
			params.noConnect = true;
			socket.send(params, function( response )
			{
				if (This.data)
				{
					callback( parseInt(This.data) );
				}
				else
				{
					callback(null);
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
			This.data = "";
			params.command = 'G';
			params.decorator = function(_data)
			{
				This.data+= _data;
			}
			socket.send(params, function(response)
			{

				if (This.data.length > 0 && response != null)
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
								nro_salida: parseInt(nro_salida),
								note: params.ip.concat("-",tipo,nro_salida),
								tipo: tipo,
								ip: params.ip,
								estado: parseInt(estado),
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
