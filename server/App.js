var socket 		= require('./socket')(),
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore');

function DataStore() {
	this.reader 	  = require('jsonfile');
	this.dispositivos = [];
	this.tareas 	  = [];
	this.tareasActivas= [];
	this.getFile = function(file) {
		this[file] = this.reader.readFileSync('./models/'+file+'.json');
		return this[file];
	};
	this.lastID = function( tarea ) {
		var id_tarea;
		if (this.tareas.length) {
			var last = _.last(this.tareas);
			id_tarea= last.id_tarea + 1;
		}
		else {
			id_tarea = 1;
		}
		return id_tarea;
	};
	this.saveModel = function(fileName, model, key, callback) {
		//Nuevo
		if (model.isNew) {
			delete model.isNew;
			if (fileName == 'tareas') {
				model[key] = this.lastID();
			}
			this[fileName].push( model );
		}
		else {
			//Busco el modelo, y lo reemplazo por el recibido
			var filter = {};
				filter[key] = model[key];
			_.extend(_.findWhere(this[fileName], filter ), model);
		}
		this.updateFile(fileName,function(response) {
			callback(response, model)
		});
	};
	this.updateFile = function(file, callback) {
		var onWrite = function(err) {
			callback(err);
		}
		//Escribo el archivo json
		this.reader.writeFile('./models/'+file+'.json', this[file], onWrite);
	};
	this.deleteModel = function(fileName, filter, callback) {

		//Actualiza el array, removiendo el modelo que coincide con filter
		this[fileName] = _.without(this[fileName],_.findWhere(this[fileName], filter));

		this.updateFile(fileName,function(response) {
			callback(response)
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
				if (str.length) {
					var posGuion 	= str.indexOf("-"),
						posDospuntos= str.indexOf(":"),
						posPunto 	= str.indexOf("."),
						nro_salida 	= str[posGuion+1] + str[posGuion+2];

					if (posPunto > -1) {
						var temporizada = DateConvert.min_a_horario(str.substr( posPunto + 1));
					}
					parsed.push({
						nro_salida: parseInt(nro_salida),
						tipo: str[0],
						ip: params.ip,
						note: This.getSalidaByNro(nro_salida).note || params.ip,
						estado: parseInt( str[posDospuntos+1] ),
						temporizada: temporizada
					});
				}
			});
			return parsed;
		}
	},
	getSalidasByEstado: function(_estado, _array) {
		return _.where(_array, {estado: _estado});
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
				var salida = factory.create( s.nro_salida,s.tipo, s.note );
				This.salidas.push( salida);
			});
		}
	},
	load: function() {
		DataStore.getFile('dispositivos');
	}
}

function Salida(nro_salida, _note, _tipo) {
	this.nro_salida = nro_salida || null;
	this.note 		= _note || null;
	this.tipo 		= _tipo || null;
	this.estado 	= null;
	this.accion 	= null;
	this.comando 	= null,
	this.temporizada= null;
}

Salida.prototype.switch = function(params, callback) {
	if (params.hasOwnProperty('comando')) {
		socket.send(params, function(response, timeout) {
			callback(response)
		});
	}
};

function Luz(nro_salida, _note) {
	Salida.apply(this, [nro_salida, _note]);
	this.tipo 	 = 'L';
	this.comando = 'T';
};

Luz.prototype.switch = function(params, callback) {
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

Persiana.prototype.switch = function(params, callback) {
	var comando = this.comando + this.nro_salida + params.accion;
	var onSwitchResponse = function(response) {
		callback(response);
	}
	Salida.prototype.switch({ comando: comando, ip: this.ip}, onSwitchResponse);
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

DataStore.instance = null;
DataStore.getInstance = function(){
    if(this.instance === null){
        this.instance = new DataStore();
    }
    return this.instance;
}
exports.DataStore = DataStore.getInstance();