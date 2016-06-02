// Dependencias
var DataStore 	= require('./Clases.js').DataStore;
var Arduinode 	= require('./Arduinode'),
	DateConvert = require('./utils/DateConvert')(),
	_ 			= require('underscore'),
	schedule = require('node-schedule');

/**************** Clase Tarea *******************

Representa una Tarea (comando programado);
Las tareas son comandos programados para enviar a los dispositivos Arduino.
Ej; Encender una Luz en un día y horario determinados, con recurrencia opcional;

//*************** Clase Arduinode *****************/
function Tarea(config) {
	this.config = config;

	//Parse de parametros de la tarea
	this.parseConfig();

	//Setea reglas de ejecucion para el Scheduler
	this.setExecutionRules();
}
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
	ejecutar: function(callback) {
		var This = this,
			i = 0,
		loop = function(i) {
			var dispositivoTarea = This.config.dispositivos[i];
			if (dispositivoTarea) {
				//Seteo la misma temporizacion para todos los dispositivos
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
		//Termino de iterar los dispositivos de la tarea
		else {
			if (callback) callback();
		}
	},
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

/**************** Clase Programador de tareas *******************

Clase (Singleton) para ABM de tareas.

Las tareas activas, se almacenan en DataStore.tareas

Permite:
		1) Crear, eliminar, modificar y reprogramar tareas;
		2) Observar ejecucion de tareas:
			Se relanzan cada x tiempo, (definido en tiempoEscaneoTareas)
			si se corta el servicio;

El modulo schedule permite programar las tareas;

//*************** Clase Arduinode *****************/
var Programador = function()
{
		this.setConfig = function( config )
		{
			this.config = config;
		};
		this.reprogramarTarea = function( _tarea )
		{
			//Elimino la tarea de tareas en ejecucion
			this.quitarTareaEnEjecucion( _tarea );

			//Añado la tarea actualizada, al scheduler
			var tarea = new Tarea( _tarea );
			this.loadInScheduler( tarea );
		};
		this.quitarTareaEnEjecucion = function( tarea )
		{
			DataStore.tareasActivas.forEach(function(s,k,_this) {
				if (s.id == tarea.id_tarea) {
					delete _this[k];
				}
			});
		};
		this.quitarTarea = function( _tarea )
		{
			//Ejecuta comandos de apagado en los dispositivos de la tarea
			_tarea.accion = 1;
			var tarea = new Tarea( _tarea );
			tarea.ejecutar(function() {
				this.quitarTareaEnEjecucion( _tarea);
			});
		};
		this.loadInScheduler = function( tarea )
		{
			var This = this;

			//Chequeo si la tarea deberia ejecutarse en este momento
			this.forzarEjecucion( tarea );

			//Agrego tarea al Scheduler
			var job = schedule.scheduleJob( tarea.getExecutionRules(), function() {
				console.log("Ejecutando tarea:",tarea.config.descripcion);

				if ( tarea.isValid() ) {
					tarea.ejecutar();
				}
			});

			job.id = tarea.config.id_tarea;
			DataStore.tareasActivas.push(job);
		};
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
		this.observarCambios = function()
		{
			var This = this;
			console.log("Observando las tareas cada ",
						parseInt((this.config.tiempoEscaneoTareas / 1000) / 60),
						" minutos ...");
			setInterval(function()
			{
				//Carga tareas en Scheduler
				DataStore.tareas.forEach(function( tarea )
				{
					// Creo objeto tarea, parseando la configuracion
					var tarea = new Tarea(tarea);
					This.forzarEjecucion(tarea);
				});
			},this.config.tiempoEscaneoTareas)
		};
		this.loadTareas = function()
		{
			var This = this;

			//Carga lista de tareas en memoria => (DataStore.tareas)
			DataStore.getFile('tareas');
			console.log("Importando ",DataStore.tareas.length, " tarea/s");

			//Carga tareas en Scheduler
			DataStore.tareas.forEach(function( tarea )
			{
				// Creo objeto tarea, parseando la configuracion
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