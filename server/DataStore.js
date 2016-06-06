/**
 * Almacena en memoria, y archivos JSON, los modelos de la aplicación.
 * Lista de dispositivos y salidas asociadas.
 * Lista de tareas programadas.
 * @module DataStore
*/

var fs	= require('fs'),
	_	= require('underscore');

/**
* Clase (singleton) para trabajar con archivos JSON
* y almacenar los modelos de la aplicación
*
* @class DataStore
* @constructor
*/

/**
* Listado de dispositivos Arduino registrados
* @property dispositivos
* @type Array
*/
/**
* Listado de tareas programadas registradas
* @property tareas
* @type Array
*/
/**
* Listado de tareas cargadas en scheduler (listas para ejecución)
* @property tareasActivas
* @type Array
*/
function DataStore() {
	this.reader 	  = require('jsonfile');
	this.dispositivos = [];
	this.tareas 	  = [];
	this.tareasActivas= [];
	this.getFile = function(file) {

		//Si el archivo solicitado no existe, se crea
		var filePath = './models/'+file+'.json';
		if (!fs.existsSync(filePath)) {
			fs.writeFileSync(filePath, '[]');
		}
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

/**
* Método para actualizar un modelo
* @method saveModel
* @param {String} fileName Nombre del archivo JSON
* @param {JSON} model Datos del nuevo o modificado modelo
* @param {String} key Clave por la cual filtrar el modelo a modificar
* @param {Function} callback Function de retorno
*/
	this.saveModel = function( fileName, model, key, callback ) {
		if (model.isNew) {
			delete model.isNew;
			if (fileName == 'tareas') {
				model[key] = this.lastID();
			}
			this[fileName].push( model );
		}
		else {
			var filter = {};
				filter[key] = model[key];
			_.extend(_.findWhere(this[fileName], filter ), model);
		}
		this.updateFile(fileName,function(response) {
			callback(response, model)
		});
	};
/**
* Método para escribir en el archivo JSON
* @method updateFile
* @param {String} file Nombre del modelo
* @param {Function} callback Function de retorno
*/
	this.updateFile = function(file, callback) {
		var onWrite = function(err) {
			callback(err);
		}
		this.reader.writeFile('./models/'+file+'.json', this[file], onWrite);
	};
/**
* Método para escribir en el archivo JSON
* @method deleteModel
* @param {String} fileName Nombre del archivo JSON
* @param {JSON} filter Filtro para encontrar el modelo a eliminar
* @param {Function} callback Function de retorno
*/
	this.deleteModel = function(fileName, filter, callback) {
		this[fileName] = _.without(this[fileName],_.findWhere(this[fileName], filter));

		this.updateFile(fileName,function(response) {
			callback(response)
		});
	};
};

DataStore.instance = null;
DataStore.getInstance = function(){
    if(this.instance === null){
        this.instance = new DataStore();
    }
    return this.instance;
}
exports.DataStore = DataStore.getInstance();