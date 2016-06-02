/**
 * Almacena en memoria, y archivos JSON, los modelos de la aplicación.
 * Lista de dispositivos y salidas asociadas.
 * Lista de tareas programadas.
 * @module DataStore
 */

var fs	= require('fs'),
	_	= require('underscore');

/**
* Clase (singleton) para trabajar con archivos JSON, y almacenar los modelos de la aplicación
*
* @class Tarea
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
	this.saveModel = function( fileName, model, key, callback ) {
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

DataStore.instance = null;
DataStore.getInstance = function(){
    if(this.instance === null){
        this.instance = new DataStore();
    }
    return this.instance;
}
exports.DataStore = DataStore.getInstance();