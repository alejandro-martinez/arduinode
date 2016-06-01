var clases 		= require('./App.js'),
	socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore'),
	Dispositivo = clases.Dispositivo,
	DataStore 	= clases.DataStore,
	net 		= require('net');
	const ON = 0, OFF = 1;

var Arduino = function() {
	this.socketTCP = null;
	this.listenSwitchEvents = function( conf ) {
		var This = this;

		// Crea el socket que recibe comandos de los disp. Arduino
		if (!this.socketTCP) {

			this.socketTCP = net.createServer(function( socket ) {
				socket.on('data', function( data ) {
					var parsed = data.toString().replace("\r","");
						salida = Dispositivo.prototype.parseSalida.call(
										this,
										{ ip: socket.remoteAddress },
										parsed.trim()
								 );
					This.dispositivos.broadcast.emit('switchBroadcast', salida);
					socket.end();
				});
			});

			this.socketTCP.listen({ host: conf.ip, port: conf.port + 1 }, function() {
				console.log('Socket escuchando arduinos en:'+conf.ip,conf.port+1)
			});
		}
	};
	this.dispositivos = {
		lista: [],
		sCliente: null,
		//Carga listado de dispositivos desde archivo JSON, en variable lista
		getAll: function() {
			return this.lista;
		},
		getByIP: function(ip) {
			return _.findWhere(this.lista,{ip: ip});
		},
		accionar: function( params, callback ) {
			this.getByIP( params.ip ).accionarSalida( params, function(response) {
				callback(response);
			});
		},
		getSalidas: function( callback, params ) {
			var disp = this.getByIP( params.ip ),
				onData = function(salidas) {
					callback(salidas);
				};
			disp.getSalidas(params, onData);
		},
		getSalidasEncendidas: function( callback ) {
			var This = this;
			var salidasAux = [], sockets = [], processed = [], This = this,
				emit = function(data) {
					This.sCliente.emit('salidasEncendidas', data);
				};
			this.lista.forEach(function(item, key, array)
			{
				item.buffer = "";
				var salidas,
					connectedSuccess = false,
					encendidas = [],
					params = {
						noError: true,
						ip: item.ip,
						id_disp: item.id_disp,
						filterByEstado: '0'
					};

				sockets[key] = new net.Socket();
				sockets[key].setTimeout(1000);
				sockets[key].connect(8000, item.ip, function(response)
				{
					connectedSuccess = true;
					sockets[key].write('G')
				})
				sockets[key].on('timeout',function(_err)
				{
					if (processed.indexOf(item.ip) < 0) {
						processed.push(item.ip);
						emit([]);
					}
				});

				sockets[key].on('data',function(_data)
				{
					item.buffer+= _data;
				});

				//Si fallo la conexión, aviso al cliente con un array nulo
				sockets[key].on('error',function(_err)
				{
					connectedSuccess = false;
					if (processed.indexOf(item.ip) < 0) {
						processed.push(item.ip);
						emit([]);
					}
				});
				sockets[key].on('end',function()
				{
					var salidas = item.parseSalida(item, item.buffer);
					if (salidas.length > 0 && connectedSuccess)
					{
						emit(item.getSalidasByEstado(ON, salidas));
						item.buffer = "";
					}
				});
			});
		},
		load: function() {
			var This = this;
			this.lista = [];
			DataStore.getFile('dispositivos').forEach(function(d) {
				var disp = new Dispositivo( d.id_disp, d.ip, d.note );
				disp.setSalidas( d.salidas );
				This.lista.push(disp);
			});
		}
	}
}

Arduino.instance = null;
Arduino.getInstance = function(){
    if(this.instance === null){
        this.instance = new Arduino();
    }
    return this.instance;
}
module.exports = Arduino.getInstance();