/**
 * Módulo para la programacion y ejecucion de tareas sobre los dispositivos
 *
 * @module Programador de Tareas
 */
var DataStore 	= require('./DataStore').DataStore;
var Arduinode 	= require('./Arduinode'),
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore'),
	schedule = require('node-schedule');
/**
* Representa una Tarea (comando programado)
* Las tareas son comandos programados para enviar a los dispositivos Arduino.
* Ej; Encender una Luz en un día y horario determinados, con recurrencia opcional;
*
* @class Tarea
* @constructor
*/

function Tarea(config) {
	this.config = config;

	//Parse de parametros de la tarea
	this.parseConfig();

	//Setea reglas de ejecucion para el Scheduler
	this.setExecutionRules();
}
/**
* Tiempo en minutos, durante el cual se ejecuta la tarea
* @property temporizada
* @type String
*/
/**
* Lista de dispositivos Arduino sobre la cual se ejecutan los comandos
* @property dispositivos
* @type Array
*/
Tarea.prototype = {
	parseConfig	: function() {
		var t = this.config;
		var parseData = {
			hora_ini: 		t.hora_inicio.substr(0,2),
			min_ini: 		t.hora_inicio.substr(-2),
			raw_hora_inicio:t.hora_inicio,
			dias_ejecucion: DateConvert.strToArray( t.dias_ejecucion ),
			temporizada: 	DateConvert.horario_a_min( t.duracion ),
			raw_duracion: 	t.duracion
		};
		this.config = _.extend(this.config, parseData);
	},
/**
* Ejecuta una tarea.
* Itera el array de dispositivos de la tarea,
* extrayendo IP del dispositivo y numero de salida a Accionar
* @method ejecutar
* @return callback (Opcional)
*/
	ejecutar: function( callback ) {
		var This = this,
			i = 0,
		loop = function(i) {
			var dispositivoTarea = This.config.dispositivos[i];
			if (dispositivoTarea) {
				dispositivoTarea.temporizada = This.config.temporizada;
				dispositivoTarea.estado 	 = This.config.accion;

				Arduinode.dispositivos.accionar(dispositivoTarea, function(response) {
					i++;
					loop(i);
				});
			}
		}
		if (This.config.dispositivos.length > i) {
			loop(i);
		}
		else {
			if (callback) callback();
		}
	},
/**
* Setea reglas de ejecucion para la tarea que se envia al scheduler.
* Los parametros provienen del objeto config de la Clase Tarea
* Parametros: Dia de ejecucion, hora, minuto, segundo
* @method setExecutionRules
* @return rule
*/
	setExecutionRules: function() {
		var rule 			= new schedule.RecurrenceRule();
		rule.dayOfWeek 		= this.config.dias_ejecucion;
		rule.second 		= 0;
		rule.hour 			= parseInt( this.config.hora_ini );
		rule.minute 		= parseInt( this.config.min_ini );
		this.executionRules = rule;
		return rule;
	},
	getExecutionRules: function() {
		return this.executionRules;
	},
/**
* Retorna el tiempo restante (en minutos) de una tarea, (si existe)
* Se calcula a partir de la hora inicio y la duracion de la tarea
* @method getTiempoRestante
* @return Integer
*/
	getTiempoRestante: function() {
		var t = this.config;
		return DateConvert.minutosRestantes( t.raw_hora_inicio, t.raw_duracion );
	},
	isFechaValida: function() {
		if ( DateConvert.fechaBetween( this.config ) ) {
			if ( DateConvert.diaActualValido( this.config.dias_ejecucion )) {
				return true;
			}
		}
		return false;
	},
	isHorarioValido: function() {
		var t = this.config;
		return ( DateConvert.horaActualValida( t.raw_hora_inicio, t.raw_duracion) );
	},
/**
* Determina si una tarea es valida para su ejecucion
* Se comprueba el atributo activa, fecha, hora y dias de ejecucion
* @method isValid
* @return Boolean
*/
	isValid: function() {

		var t = this.config;

		//Verifica que la tarea esté activa el rango de fechas y que la tarea este activa
		if ( this.config.activa ) {

			//Verifica Fecha y Horario
			if ( this.isFechaValida() && this.isHorarioValido() ) {

				//Si la tarea deberia estar ejecutandose, calcula el tiempo restante
				var min_rest = this.getTiempoRestante( t.raw_hora_inicio,t.raw_duracion );
				if ( min_rest > 0 )
				{
					return min_rest;
				}
			}
		}
		return false;
	}
}
/**
* Clase (Singleton) para ABM de tareas.
* El modulo schedule permite programar las tareas;
* Permite:
*		1) Crear, eliminar, modificar y reprogramar tareas;
*		2) Observar ejecucion de tareas:
*			Se relanzan cada x tiempo, (definido en tiempoEscaneoTareas)
*			si se corta el servicio;
*
* @class Programador
* @constructor
*/
/**
* Parametros de configuración (Tiempo de escaneo de tareas)
* @property config
* @type JSON
*/
//*************** Clase Arduinode *****************/
var Programador = function()
{
		this.setConfig = function( config )
		{
			this.config = config;
		};
/**
* Se lanza al modificar una tarea existente. Quita la tarea del scheduler,
* y la agrega nuevamente con los cambios hechos.
* @method reprogramarTarea
* @param _tarea la configuración de la tarea, (se parsea y se crea instancia Tarea)
* @return null
*/
		this.reprogramarTarea = function( _tarea )
		{
			this.quitarTareaEnEjecucion( _tarea );
			var tarea = new Tarea( _tarea );
			this.loadInScheduler( tarea );
		};
/**
* Quita una tarea del array de tareasActivas de DataStore
* @method quitarTareaEnEjecucion
* @param tarea la tarea a quitar
* @return null
*/
		this.quitarTareaEnEjecucion = function( tarea )
		{
			DataStore.tareasActivas.forEach(function(s,k,_this) {
				if (s.id == tarea.id_tarea) {
					delete _this[k];
				}
			});
		};
/**
* Al quitar una tarea, se ejecuta la accion de apagado sobre los
* dispositivos asociados a la misma.
* @method quitarTarea
* @param _tarea la configuracion de tarea a quitar. (Se parsea y se crea instancia Tarea)
* @return null
*/
		this.quitarTarea = function( _tarea )
		{
			_tarea.accion = 1;
			var tarea = new Tarea( _tarea );
			tarea.ejecutar(function() {
				this.quitarTareaEnEjecucion( _tarea);
			});
		};
/**
* Agrega un objeto Tarea al scheduler (modulo schedule).
* dispositivos asociados a la misma.
* Requiere el objeto rule devuelto por tarea.getExecutionRules()
* Registra la tarea como activa, en DataStore.tareasActivas
* @method loadInScheduler
* @param tarea objeto tarea (instancia de Tarea)
* @return null
*/
		this.loadInScheduler = function( tarea )
		{
			var This = this;
			this.forzarEjecucion( tarea );
			var job = schedule.scheduleJob( tarea.getExecutionRules(), function() {
				console.log("Ejecutando tarea:",tarea.config.descripcion);

				if ( tarea.isValid() ) {
					tarea.ejecutar();
				}
			});

			job.id = tarea.config.id_tarea;
			DataStore.tareasActivas.push(job);
		};
/**
* Intenta ejecutar una tarea forzosamente. Comprobando si es valida,
* y el tiempo restante.
* @method forzarEjecucion
* @param tarea objeto tarea (instancia de Tarea)
* @return null
*/
		this.forzarEjecucion = function( t )
		{
			if ( t.config.accion == 0 && t.isValid() ) {
				var tiempo_restante = t.getTiempoRestante();

				console.log("Tiempo restante de ",t.config.descripcion,
							DateConvert.min_a_horario(tiempo_restante));
				t.config.estado = t.accion;
				t.config.temporizada = tiempo_restante;
				t.ejecutar();
			}
			else {
				console.log("La tarea a forzar no es valida",t.config.descripcion);
			}
		};
/**
* Recorre el listado de tareas e intenta forzar la ejecucion de cada una.
* Registra la tarea como activa, en DataStore.tareasActivas
* @method observarCambios
* @param tiempoEscaneoTareas en milisegundos
*/
		this.observarCambios = function()
		{
			var This = this;
			console.log("Observando las tareas cada ",
						parseInt((this.config.tiempoEscaneoTareas / 1000) / 60),
						" minutos ...");
			setInterval(function()
			{
				DataStore.tareas.forEach(function( tarea )
				{
					var tarea = new Tarea(tarea);
					This.forzarEjecucion(tarea);
				});
			},this.config.tiempoEscaneoTareas)
		};

/**
* Importa listado de tareas desde archivo JSON, a DataStore.tareas
* y las carga en scheduler.
* @method loadTareas
*/
		this.loadTareas = function()
		{
			var This = this;
			DataStore.getFile('tareas');
			console.log("Importando ",DataStore.tareas.length, " tarea/s");
			DataStore.tareas.forEach(function( tarea )
			{
				var tarea = new Tarea(tarea);
				This.loadInScheduler(tarea);
			});
		};
}

Programador.instance = null;
Programador.getInstance = function(){
    if(this.instance === null){
        this.instance = new Programador();
    }
    return this.instance;
}
module.exports = Programador.getInstance();