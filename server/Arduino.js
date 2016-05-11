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
				params.salidas.forEach(function (s)
				{
					if (parseInt(s.nro_salida) == params.nro_salida)
					{
						if (s.ip == params.ip)
						{
							return found(true);
						}
					}
				});
			}
			else
			{
				return found(false);
			}
		},
		parseSalida: function( params, salidaStr ) {
			var posGuion = salidaStr.indexOf("-"),
				posDospuntos = salidaStr.indexOf(":"),
				posPunto = salidaStr.indexOf(".");
				switch (salidaStr[0])
				{
					case 'B':
					case 'L':
					case 'P':
						var nro_salida = salidaStr[posGuion+1] + salidaStr[posGuion+2],
							estado = salidaStr[posDospuntos+1],
							tipo = salidaStr[0];
							if (posPunto > -1) {
								var temporizada = DateConvert.min_a_horario(salidaStr.substr( posPunto + 1));
							}
						break;
					default:
						return;
				}
			return {
				nro_salida: parseInt(nro_salida),
				tipo: tipo,
				ip: params.ip,
				estado: parseInt(estado),
				temporizada: temporizada
			};

		},
		formatSalidas: function(params, _salidas)
		{
			var This = this;
			var infoSalida = [];
			params.formatted = [];
			_salidas.forEach(function(s)
			{
				var salidas = [],
					formatted = This.parseSalida(params,s);
					var _params =
						{
							salidas: _salidas,
							nro_salida: parseInt( formatted.nro_salida ),
							ip: params.ip,
							tipo: formatted.tipo
						};
					if (params.salidasOrig)
					{
						infoSalida = params.salidasOrig.filter(function(s)
						{
							return s.nro_salida == formatted.nro_salida
								&& s.ip == params.ip;
						});
					}
					//Quitar repetidas
					This.buscarSalida(_params, function(_found)
					{
						This.found = _found;
					});
					if (!This.found)
					{
						var note;
						if (params.salidasOrig)
							note = infoSalida[0].note;
						else
							note = params.ip.concat("-",formatted.nro_salida);

						formatted.note = note;
						params.formatted.push(formatted);
					}
			});
			return params.formatted;
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
					callback( This.formatSalidas(params,
							  This.data.match(/[^\r\n]+/g)) );
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
