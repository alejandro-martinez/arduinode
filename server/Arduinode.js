/**
 * Modulo Principal de la aplicación
 * Interactua con Dispositivo y Socket, a través de una clase Facade (Arduinode)
 * @module Arduinode
 */

var clases 		= require('./Clases.js'),
	socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore'),
	Dispositivo = clases.Dispositivo,
	DataStore 	= require('./DataStore').DataStore,
	net 		= require('net');
	const ON = 0, OFF = 1;

/**************** Clase Arduinode *******************

Clase (Singleton) principal de la aplicación

	- Interactua con Dispositivo y Socket;
	- Mantiene un listado de dispositivos activos

Permite:
	1) Escuchar eventos de los dispositivos reales, a través de listenSwitchEvents,
	   cuando se produce un evento (por Ej; switch de una Luz), se envía un broadcast
	   a todos los sockets conectados.
	2) Consultar listado de Salidas activas (Luces encendidas)

//*************** Clase Arduinode *****************/
/**
* Clase (Singleton, Facade) principal de la aplicación
* - Interactua con Dispositivo y Socket;
* - Mantiene un listado de dispositivos activos
*
* @class Arduinode
* @constructor
*/

/**
* Instancia de modulo net, para recibir datos de Dispositivos Arduino reales
* @property socketTCP
* @type net Object (socket)
*/
/**
* Lista de dispositivos Arduino registrados
* @property dispositivos
* @type JSON Object
*/
var Arduinode = function() {
	this.socketTCP = null;
/**
* Registra un socket para escuchar eventos de los dispositivos Arduino reales.
* Emite un broadcast a todos los dispositivos conectados a la aplicacion,
* cuando se produce un evento,
* @method listenSwitchEvents
* @param conf Configuracion para el socket (IP, puerto)
* @return null
*/
	this.listenSwitchEvents = function( conf ) {
		var This = this;
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
/**
* Devuelve lista de dispositivos Arduino registrados
* @method getAll
* @param conf Configuracion para el socket (IP, puerto)
* @return Array
*/
		getAll: function() {
			return this.lista;
		},
/**
* Devuelve dispositivo filtrado por IP
* @method getByIP
* @param ip IP del dispositivo a buscar
* @return Dispositivo
*/
		getByIP: function(ip) {
			return _.findWhere(this.lista,{ip: ip});
		},
/**
* Ejecuta un comando sobre una salida de un Dispositivo
* @method accionar
* @param params Objeto JSON con las claves: IP del dispositivo, numero de salida, accion y temporización
* @return Boolean
*/
		accionar: function( params, callback ) {
			var This = this;
			this.getByIP( params.ip ).accionarSalida( params, function(response) {
				callback(response);
			});
		},

/**
* Devuelve las salidas de un Dispositivo Arduino
* @method getSalidas
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @param params Objeto JSON con la clave IP del dispositivo
* @return Array
*/
		getSalidas: function( callback, params ) {
			var disp = this.getByIP( params.ip ),
				onData = function(salidas) {
					callback(salidas);
				};
			disp.getSalidas(params, onData);
		},
/**
* Devuelve listado de salidas de un Dispositivo, filtradas por estado = 0 (Encendidas)
* @method getSalidasEncendidas
* @param callback Funcion callback que se ejecuta cuando se completa la operaciòn
* @param params Objeto JSON con la clave IP del dispositivo
* @return Array
*/
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
/**
* Registra dispositivos cargados en el modelo (dispositivos.json), en DataStore.dispositivos
* y en atributo lista de esta clase
* @method load
*/
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

Arduinode.instance = null;
Arduinode.getInstance = function(){
    if(this.instance === null){
        this.instance = new Arduinode();
    }
    return this.instance;
}
module.exports = Arduinode.getInstance();