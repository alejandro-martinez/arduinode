var socket 		= require('./socket')(),
	_ 			= require('underscore'),
	DateConvert = require('./utils/DateConvert')();

function dataStore() {
	this.reader = require('jsonfile');
	this.dispositivos = [];
	this.tareas = [];
	this.getFile = function(file) {
		this[file] = this.reader.readFileSync('./models/'+file+'.json');
		return this[file];
	};
	this.saveDispositivo = function(dispositivo, callback) {

		//Busco el dispositivo, y lo reemplazo por el recibido
		_.extend(_.findWhere(this.dispositivos, { ip: dispositivo.ip }), dispositivo);

		//Nuevo dispositivo
		if (dispositivo.isNew) {
			delete dispositivo.isNew;
			this.dispositivos.push( dispositivo );
		}
		//Escribo el array this.dispositivos en el archivo JSON
		this.updateFile(function(response) {
			callback(response)
		});
	};
	this.updateFile = function(callback) {
		var onWrite = function(response) {
			callback(response);
		}
		//Escribo el archivo json
		this.writeJSON(this.dispositivos,'dispositivos',onWrite);
	};
	this.deleteDispositivo = function(ip, callback) {

		//Actualiza el array, removiendo el dispositivo cuya IP es ip
		this.dispositivos = _.without(this.dispositivos,
								_.findWhere(this.dispositivos, {ip: ip}));

		//Escribo el array this.dispositivos en el archivo JSON
		this.updateFile( function(response) {
			callback(response)
		});
	};
	this.writeJSON = function(content, file, callback) {
		var This = this;
		this.reader.writeFile('./models/'+file+'.json', content, function(err) {
			//Actualizo el archivo en memoria
			if (!err) {
				This[file] = content;
			}
			callback(err);
		});
	};
};


function Dispositivo(_id, _ip, _note) {

	this.id_disp = _id || null;
	this.ip = _ip || null;
	this.note = _note || null;
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
				var posGuion = str.indexOf("-"),
					posDospuntos = str.indexOf(":"),
					posPunto = str.indexOf(".");
					switch (str[0])
					{
						case 'B':
						case 'L':
						case 'P':
							var nro_salida = str[posGuion+1] + str[posGuion+2],
								estado = str[posDospuntos+1],
								tipo = str[0];
								if (posPunto > -1) {
									var temporizada = DateConvert.min_a_horario(str.substr( posPunto + 1));
								}
							break;
						default:
							return;
					}
					parsed.push({
						nro_salida: parseInt(nro_salida),
						tipo: tipo,
						ip: params.ip,
						note: This.getSalidaByNro(nro_salida).note || params.ip,
						estado: parseInt(estado),
						temporizada: temporizada
					});
			});
			return parsed;
		}
	},
	getSalidasByEstado: function(_estado, _array) {
		var salidas = _array.filter(function(s) {
			return s.estado === _estado;
		})
		return salidas;
	},
	getSalidas: function(params, callback) {
		params.comando = 'G';
		var This = this;
		socket.send(params, function(response) {
			callback(This.parseSalida(params, response));
		});
	},
	//Devuelve listado de salidas (y sus estados) de un dispositivo
	setSalidas: function(_salidas) {
		var This = this;
		if (_salidas.length) {
			_salidas.forEach(function(s) {
				var factory = new SalidaFactory();
				var salida = factory.create(s.nro_salida,s.tipo, s.note);
				This.salidas.push( salida);
			});
		}
	},
	load: function() {
		dataStore.getFile('dispositivos');
	}
}

function Salida(nro_salida, _note, _tipo) {
	this.nro_salida = nro_salida || null;
	this.note = _note || null;
	this.tipo = _tipo || null;
	this.estado = null;
	this.accion = null;
	this.comando = null,
	this.temporizada = null;
}

Salida.prototype.switch = function(params, callback) {
	socket.send(params, function(response) {
		callback(response)
	});
};

function Luz(nro_salida, _note) {
	Salida.apply(this, [nro_salida, _note]);
	this.tipo 	 = 'L';
	this.comando = 'T';
};

Luz.prototype.switch = function(params, callback) {
	//params.estado .. Accion sobre la salida (encender o apagar)
	var comando = this.comando + this.nro_salida + params.estado;
	Salida.prototype.switch({comando: comando, ip: this.ip}, function(response){
		callback(response);
	});
};

function Persiana(nro_salida, _note) {
	Salida.apply(this,[nro_salida, _note]);
	this.tipo = 'P';
	this.comando = 'P';
};

Persiana.prototype.switch = function(params, callback){
	var comando = this.comando + this.nro_salida + params.accion;
	Salida.prototype.switch({comando: comando, ip: this.ip}, function(response){
		callback(response);
	});
};

function SalidaFactory() {
	this.create = function(nro_salida,_tipo, _note) {
		if (_tipo === "L") {
			return new Luz(nro_salida, _note);
		}
		else {
			return new Persiana(nro_salida,_note);
		}
	}
}

exports.Dispositivo = Dispositivo;

dataStore.instance = null;

/**
 * Singleton getInstance definition
 */
dataStore.getInstance = function(){
    if(this.instance === null){
        this.instance = new dataStore();
    }
    return this.instance;
}
exports.dataStore = dataStore.getInstance();