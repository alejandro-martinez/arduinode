// Tarea programadas
var DataStore = require('../App.js').DataStore;
var Arduino = require('../Arduino'),
	DateConvert = require('../utils/DateConvert')(),
	_ 			= require('underscore'),
	schedule = require('node-schedule');

function Tarea(config) {
	this.config = config;
}
Tarea.prototype = {
	remove	 	: function() {},
	parseConfig	: function() {

		var t = this.config;
		this.config = {
			id_tarea: 		t.id_tarea,
			activa: 		t.activa,
			accion: 		t.accion,
			dispositivos: 	t.dispositivos,
			dia_inicio	: 	t.dia_inicio,
			mes_inicio	: 	t.mes_inicio,
			hora_ini: 		t.hora_inicio.substr(0,2),
			min_ini: 		t.hora_inicio.substr(-2),
			raw_hora_inicio:t.hora_inicio,
			dias_ejecucion: DateConvert.strToArray(t.dias_ejecucion),
			dia_fin	: 		t.dia_fin,
			mes_fin	: 		t.mes_fin,
			temporizada: 	DateConvert.horario_a_min( t.duracion ),
			raw_duracion: 	t.duracion,
			descripcion: 	t.descripcion
		};
		//Setea reglas de ejecucion para el Scheduler
		this.setExecutionRules();
	},
	ejecutar: function(tarea) {
		var This = this,
			i = 0,
		loop = function(i) {
			var params = This.config.dispositivos[i];

			//Seteo la misma temporizacion para todos los dispositivos
			params.temporizada = This.config.temporizada;
			params.estado 	   = This.config.accion;

			Arduino.dispositivos.accionar(params, function(response) {
				i++;
				loop(i);
			});
		}
		loop(i);
	},
	setExecutionRules: function() {
		var rule = new schedule.RecurrenceRule();
		rule.dayOfWeek 	= this.config.dias_ejecucion;
		rule.second 	= 0;
		rule.hour 		= parseInt(this.config.hora_ini);
		rule.minute 	= parseInt(this.config.min_ini);
		this.executionRules = rule;
		return rule;
	},
	getExecutionRules: function() {
		return this.executionRules;
	},
	isValid: function() {

		var t = this.config;

		if (t.activa) {
			//Verifico el rango de fechas
			if (DateConvert.fechaBetween(t)) {
				//Verifico que el dia sea valido
				if (DateConvert.diaActualValido(t.dias_ejecucion)) {
					//Verifico que se a un horario valido
					if (t.accion == 1) {
						if( DateConvert.horaActualValida( t.raw_hora_inicio, '00:00' ) ) {
							return true;
						};
					}
					if( DateConvert.horaActualValida( t.raw_hora_inicio, t.raw_duracion ) ){
						var min_rest = DateConvert.minutosRestantes( t.raw_hora_inicio, t.raw_duracion )
						if ( min_rest > 0 )
						{
							return min_rest;
						}
					}
				}
			}
		}
		return false;
	}
}
var Programador = function()
{
		this.setConfig = function(config)
		{
			this.config = config;
		};
		this.reprogramarTarea = function(_tarea)
		{
			//Elimino la tarea de tareas en ejecucion
			DataStore.tareasActivas.forEach(function(s,k,_this) {

				if (s.id == _tarea.id_tarea) {
					delete _this[k];
				}
			});
			//Añado la tarea actualizada, al scheduler
			var tarea = new Tarea(_tarea);
			tarea.parseConfig();
			this.loadInScheduler(tarea);
		};
		this.quitarTarea = function(tarea) {
			console.log("Removiendo tarea de scheduler",tarea)
		};
		this.loadInScheduler = function( tarea )
		{
			var This = this;

			//Chequeo si la tarea es valida para ejecutarse en este momento
			// y si la accion de la misma es Encendido (las de Apagado no se forzan)

			if (tarea.isValid()) {
				this.forzarEjecucion(tarea);
			}
			else {
				console.log("La tarea a forzar no es valida",tarea.config.descripcion);
			}
			var job = schedule.scheduleJob( tarea.getExecutionRules(), function() {
				console.log("Ejecutando tarea:",tarea.config.descripcion);
				if ( tarea.isValid() ) {
					tarea.ejecutar();
				}
			});
			job.id = tarea.config.id_tarea;
			DataStore.tareasActivas.push(job);
		};
		this.forzarEjecucion = function(t) {

			if (t.config.accion == 0) {
				var tiempo_restante = t.isValid(t);
				if (tiempo_restante) {
					console.log("Tiempo restante de ",
						t.config.descripcion,
						DateConvert.min_a_horario(tiempo_restante)
					);
					t.config.estado = t.accion;
					t.config.temporizada = tiempo_restante;
					t.ejecutar();
				}
			}
			else {
				console.log("La tarea '" + t.config.descripcion + "' es de apagado, no se obliga la ejecucion");
			}
		};

		/*this.ejecutarTarea = function(params, accion)
		{
			if (params.hasOwnProperty('dispositivos'))
			{
				var numDispositivos = params.dispositivos.length,
					i = 0;

				var loopDispositivos = function(i) {
					var d = params.dispositivos[i];

					d.noError = true;
					d.estado = accion || params.accion;
					d.temporizada = params.temporizada;

					socketArduino.switchSalida(d, function(response)
					{
						if (response === null)
						{
							console.log("ERROR: No se puede llegar a:",d.ip);
						}
						i++;
						if (i < numDispositivos) {
							loopDispositivos(i);
						}
					});
				}
				loopDispositivos(i);
			}
		};*/
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
					tarea.parseConfig();
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
				tarea.parseConfig();

				This.loadInScheduler(tarea);
			});
		};
}

Programador.instance = null;

/**
 * Singleton getInstance definition
 */
Programador.getInstance = function(){
    if(this.instance === null){
        this.instance = new Programador();
    }
    return this.instance;
}
module.exports = Programador.getInstance();
