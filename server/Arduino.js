var clases 			= require('./App.js');
var socket 			= require('./socket')(),
	DateConvert 		= require('./utils/DateConvert')(),
	Dispositivo 	= clases.Dispositivo,
	//Socket para comunicacion con servidor Arduino
	net 			= require('net'),
	dataStore 		= clases.dataStore;
	const ON = 0, OFF = 1;

var Arduino = function() {
	//Listado de dispositivos
	this.dispositivos = {
		sCliente: null,
		lista: [],
		//Carga listado de dispositivos desde archivo JSON, en variable lista
		getAll: function() {
			return this.lista;
		},
		getByIP: function( _ip ) {
			var disp = this.lista.filter(function(s) {
				return s.ip == _ip;
			});
			return disp[0] || null;
		},
		accionar: function(params, callback) {
			//Obtengo el dispositivo sobre el que debo actuar
			var dispositivo = this.getByIP( params.ip );
			dispositivo.accionarSalida(params, function(response){
				callback(response);
			})
		},
		getSalidasEncendidas: function(callback) {

			var salidasAux = [], sockets = [], This = this;
			this.lista.forEach(function(item, key, array)
			{
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
					This.sCliente.emit('salidasEncendidas', []);
				});

				sockets[key].on('data',function(_data)
				{
					item.buffer+= _data;
				});

				//Si fallo la conexión, aviso al cliente con un array nulo
				sockets[key].on('error',function(_err)
				{
					connectedSuccess = false;
					This.sCliente.emit('salidasEncendidas', []);
				});
				sockets[key].on('end',function()
				{

					var salidas = item.parseSalida(item, item.buffer);

					if (salidas.length > 0 && connectedSuccess)
					{
						item.buffer = "";
						var encendidas = item.getSalidasByEstado(ON, salidas);
						This.sCliente.emit('salidasEncendidas',encendidas);
					}
				});
			});
		},
		load: function() {
			var This = this,
				lista = dataStore.getFile('dispositivos');
			lista.forEach(function(d) {
				var disp = new Dispositivo(d.id_disp,d.ip,d.note);
				disp.setSalidas(d.salidas);
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