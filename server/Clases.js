/**
 * Relacionado a la programacion y ejecucion de tareas sobre los dispositivos
 *
 * @module
 */
/**************** Clases de Arduinode *******************/
//Dependencias
var socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	DataStore	= require('./DataStore'),
	fs			= require('fs'),
	_ 			= require('underscore');


/**************** Clase Dispositivo *******************

Representa un dispositivo Arduino.

Permite:
	1) accionar las salidas que posee, (Luces, Bombas, Persianas);
	2) Consultar lista de salidas y sus estados

El metodo parseSalida, formatea los datos recibidos de los dispositivos Arduino;

//*************** Clase Dispositivo *****************/

function Dispositivo(_id, _ip, _note) {
	this.id_disp = _id || null;
	this.ip 	 = _ip || null;
	this.note 	 = _note || null;
	this.salidas = [];
}

Dispositivo.prototype = {
	getSalidaByNro: function(nro_salida) {
		var salida = _.findWhere(this.salidas, { nro_salida: parseInt(nro_salida) })
		salida.ip = this.ip;
		return salida;
	},
	accionarSalida: function(params, callback) {
		var salida = this.getSalidaByNro( params.nro_salida );

		if (salida) {
			salida.switch( params ,function(response){
				callback(response);
			});
		}
	},
	parseSalida: function(params, _data ) {
		This = this;
		if (_data.length > 0) {

			var parsed = [],
				salidasParsed = [];

			if (_data.indexOf("\n") < 0) {
				salidasParsed.push(_data);
			}
			else {
				salidasParsed = _data.split("\n");
			}

			salidasParsed.forEach(function(str) {
				if (str.length) {
					var posGuion 	= str.indexOf("-"),
						posDospuntos= str.indexOf(":"),
						posPunto 	= str.indexOf("."),
						nro_salida 	= str[posGuion+1] + str[posGuion+2];

					if (posPunto > -1) {
						var temporizada = DateConvert.min_a_horario(str.substr( posPunto + 1));
					}
					parsed.push({
						nro_salida	: parseInt(nro_salida),
						tipo		: str[0],
						ip			: params.ip,
						note		: This.getSalidaByNro(nro_salida).note || params.ip,
						estado		: parseInt( str[posDospuntos+1] ),
						temporizada	: temporizada
					});
				}
			});
			return parsed;
		}
	},
	getSalidasByEstado: function( _estado, _array ) {
		return _.where(_array, {estado: _estado});
	},
	getSalidas: function( params, callback ) {
		params.comando = 'G';
		var This = this;
		socket.send( params, function( response ) {
			callback( This.parseSalida( params, response ) );
		});
	},
	//Devuelve listado de salidas (y sus estados) de un dispositivo
	setSalidas: function( _salidas ) {
		var This = this;
		if (_salidas.length) {
			_salidas.forEach(function(s) {
				var factory = new SalidaFactory(),
					salida 	= factory.create( s.nro_salida,s.tipo, s.note );
				This.salidas.push( salida);
			});
		}
	},
	load: function() {
		DataStore.getFile('dispositivos');
	}
}

/**************** Clase Salida *******************

Representa un objeto Salida de la clase Dispositivo;

Las instancias se crean a través de SalidaFactory,
dependiento del atributo tipo;

El protocolo establece la siguiente sintaxis para enviar comandos
al dispositivo Arduino:

[Comando] [Nro de salida] [:] [Accion] [.] [Temporización]

donde:

	- Temporizacion [en minutos] es opcional

	- Accion [ 1,0 ] y  Temporizacion solo se usan cuando Comando = T

	- Comando: puede valer S, T, o P

		S sirve para consultar el estado de una salida
			Uso: S + Nro de Salida

		T sirve para setear el estado de la Salida
			Uso: T + Nro de Salida + Accion (1 o 0)
			Ejemplo:
					T231 --> Apaga (OFF), a la salida numero 23
			Ejemplo Temporizacion:
					T230.60 --> Activa la salida 23 por 60 (minutos)

		P sirve para accionar sobre Salidas tipo Persiana
			Uso: P + Nro de Salida + Accion (0,1,2)
				0 --> Sube la Persiana
				1 --> Baja
				2 --> Detiene

			Ejemplo:
					P251 --> Baja la persiana cuya salida es 25

//*************** Clase Dispositivo *****************/

function Salida( _nro_salida, _note, _tipo ) {
	this.nro_salida = _nro_salida || null;
	this.note 		= _note || null;
	this.tipo 		= _tipo || null;
	this.estado 	= null;
	this.accion 	= null;
	this.comando 	= null,
	this.temporizada= null;
}

/* Metodo switch general, interactua con el socket enviandole un comando */

Salida.prototype.switch = function( params, callback ) {
	if (params.hasOwnProperty('comando')) {
		socket.send( params, function( response, timeout ) {
			callback(response)
		});
	}
};

function Luz( nro_salida, _note ) {
	Salida.apply(this, [nro_salida, _note]);
	this.tipo 	 = 'L';
	this.comando = 'T';
};

/* Cada Tipo de Salida, reescribe su modo de hacer switch */

Luz.prototype.switch = function( params, callback ) {
	var comando = this.comando
				+ this.nro_salida
				+ params.estado
				+ "."
				+ params.temporizada;
	var onSwitchResponse = function(response) {
		callback(response);
	}
	Salida.prototype.switch({ comando: comando, ip: this.ip}, onSwitchResponse);
};

function Persiana(nro_salida, _note) {
	Salida.apply(this,[nro_salida, _note]);
	this.tipo = this.comando = 'P';
};

Persiana.prototype.switch = function( params, callback ) {
	var comando = this.comando + this.nro_salida + params.estado,
		onSwitchResponse = function( response ) {
		callback(response);
	}
	Salida.prototype.switch({ comando: comando, ip: this.ip}, onSwitchResponse);
};

/* Factory para crear los distintos tipos de Salida */
function SalidaFactory() {
	this.create = function( nro_salida,_tipo, _note ) {
		if (_tipo === "L") {
			return new Luz(nro_salida, _note);
		}
		else {
			return new Persiana(nro_salida,_note);
		}
	}
}
exports.Dispositivo = Dispositivo;