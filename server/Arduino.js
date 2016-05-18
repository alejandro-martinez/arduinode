var clases 			= require('./App.js');
var socket 			= require('./socket')(),
	DateConvert 		= require('./utils/DateConvert')(),
	Dispositivo 	= clases.Dispositivo,
	//Socket para comunicacion con servidor Arduino
	net 			= require('net'),
	dataStore 		= clases.dataStore;
	const ON = 0, OFF = 1;

var Arduino = function() {
	this.socketTCP = null;
	this.listenSwitchEvents = function( conf ) {

		// Crea el socket que recibe comandos de los disp. Arduino
		if (!this.socketTCP) {

			this.socketTCP = net.createServer(function( socket ) {
				socket.on('data', function( data ) {
					var parsed = data.toString().replace("\r","");

					var salida = Dispositivo.prototype.parseSalida.call(this,
					{ip:socket.remoteAddress}, parsed.trim());
					This.dispositivos.sCliente.broadcast.emit('switchBroadcast', salida);
					socket.end();
				});
			});

			this.socketTCP.listen({ host:conf.ip, port: conf.port + 1},
				function() {console.log('Socket escuchando arduinos en:')});
		}
	};
	//Listado de dispositivos
	this.dispositivos = {
		sCliente: null,
		lista: [],
		//Carga listado de dispositivos desde archivo JSON, en variable lista
		getAll: function() {
			return dataStore.dispositivos;
		},
		getByIP: function( _ip ) {
			var disp = this.lista.filter(function(s) {
				return s.ip == _ip;
			});
			return disp[0] || null;
		},
		accionar: function(params, callback) {
			this.getByIP( params.ip ).accionarSalida(params, function(response) {
				callback(response);
			})
		},
		getSalidasEncendidas: function(callback) {

			var salidasAux = [], sockets = [], processed = [],
				This = this;
			var emit = function(data) {
				This.sCliente.emit('salidasEncendidas', data);
			}
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
				}

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
					console.log("Enviando enc de ",item.ip)
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
			var This = this,
				lista = dataStore.getFile('dispositivos');
			lista.forEach(function(d) {
				var disp = new Dispositivo(d.id_disp,d.ip,d.note);
				disp.setSalidas( d.salidas );
				This.lista.push(disp);
			});
		}
	}
}

Arduino.instance = null;

/**
 * Singleton getInstance definition
 */
Arduino.getInstance = function(){
    if(this.instance === null){
        this.instance = new Arduino();
    }
    return this.instance;
}
module.exports = Arduino.getInstance();