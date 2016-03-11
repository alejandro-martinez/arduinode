// Tarea programadas
schedule = require('node-schedule');
var socketArduino = require('../Arduino')(),
	DateConvert = require('../utils/DateConvert')();

var Programador = function()
{
		this.setConfig = function(config)
		{
			this.config = config;
		};
		this.tareas = [];
		this.reprogramarTarea = function(_newValues)
		{
			var configTarea = this.parseConfig(_newValues);
			this.nuevaTarea(configTarea);
			var tarea = this.getTarea(configTarea.id_tarea);


			/*if (_newValues.dispositivosEliminados.length > 0)
			{
				//Si la tarea es valida (está en ejecución)
				if (this.checkValidez(configTarea))
				{
					_newValues.dispositivosEliminados.forEach(function(disp)
					{
						console.log("Apagando salida de disp eliminado",disp);
						console.log("Consultando estado de salida",disp.nro_salida);
						socketArduino.getEstadoSalida(disp, function(response)
						{
							console.log("Resp",response);
						})
					});
				}
			}*/

			this.forzarEjecucion(tarea);
		};
		this.getTarea = function(id)
		{
			var tarea = this.tareas.filter(function(t)
			{
				if (parseInt(t.id_tarea) == parseInt(id))
				{
					return t;
				}
			})
			return tarea;
		};
		this.parseConfig = function(t)
		{
			var config = {
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
				descripcion: 	t.descripcion,
				enEjecucion: {}
			}
			return config;
		};
		this.registerTareaActiva = function(config, _tarea)
		{
			var tarea = this.getTarea(config.id_tarea)[0];
			if (tarea && tarea.length > 0)
			{
				tarea.enEjecucion = _tarea;
			}
		};
		this.nuevaTarea = function(config)
		{
			var This = this;
			var rule = new schedule.RecurrenceRule();
				rule.dayOfWeek = config.dias_ejecucion;
				rule.second = 0;
				rule.hour = parseInt(config.hora_ini);
				rule.minute = parseInt(config.min_ini);

			console.log("Forzando ejecucion de ",config.descripcion);

			if (this.checkValidez(config))
			{
				this.forzarEjecucion(config);
			}
			else
			{
				console.log("La tarea a forzar no es valida",config.descripcion);
			}
			delete config.enEjecucion;
			var job = schedule.scheduleJob(rule, function()
			{
				if (This.checkValidez(config))
				{
					This.ejecutarTarea(config);
				}
			});
			this.registerTareaActiva(config, job);

		};
		this.importar = function()
		{
			this.tareas = DataStore.getTareas();
			this.cargarEnScheduler();
		};
		this.checkValidez = function(t)
		{
			//Tarea activa o no?
			if (t.activa)
			{
				if (DateConvert.fechaBetween(t))
				{
					if (DateConvert.diaActualValido(t.dias_ejecucion))
					{
						var hora_fin_min = DateConvert.sumarHoras(t.raw_hora_inicio, t.raw_duracion);
						var hora_fin_HHMM = DateConvert.min_a_horario(hora_fin_min);
						var hora_actual_HHMM = DateConvert.horarioEnHHMM();
						if (DateConvert.horaActualBetween( t.raw_hora_inicio, hora_fin_HHMM ))
						{
							var tiempo_restante = DateConvert.diffHoras(hora_actual_HHMM,hora_fin_HHMM);
							if (tiempo_restante > 0)
							{
								return tiempo_restante;
							}
						}
						else
						{
							console.log("Hora actual no esta en rango horario de tarea");
						}
					}
				}
			}
			return false;
		};
		this.forzarEjecucion = function(t)
		{
			var tiempo_restante = this.checkValidez(t);

			if (tiempo_restante)
			{
				console.log("Tiempo restante de ",
												t.descripcion,
												DateConvert.min_a_horario(tiempo_restante));
				t.estado = t.accion;
				t.temporizada = tiempo_restante;
				this.ejecutarTarea(t);
			}
		};
		this.ejecutarTarea = function(params, accion)
		{
			if (params.hasOwnProperty('dispositivos'))
			{
				params.dispositivos.forEach(function(d)
				{
					d.noError = true;
					d.estado = accion || params.accion;
					d.temporizada = params.temporizada;

					socketArduino.switchSalida(d, function(response)
					{
						if (response === null)
						{
							console.log("ERROR: No se puede llegar a:",d.ip);
						}
					})
				})
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
				This.tareas.forEach(function(t)
				{
					This.forzarEjecucion(This.parseConfig(t));
				})
			},this.config.tiempoEscaneoTareas)
		};
		this.apagarTarea = function(tarea_id)
		{
			var tarea = this.getTarea(tarea_id);
			if (tarea.length > 0)
			{
				//tarea, accion
				this.ejecutarTarea(tarea[0], 1);
			}
		};
		this.cargarEnScheduler = function()
		{
			var This = this;
			console.log("Importando ",This.tareas.length, " tarea/s");
			this.tareas.forEach(function(t)
			{
				//Armo la config de la tarea y Creo la tarea
				var configTarea = This.parseConfig(t);
				This.nuevaTarea(configTarea);
			})
		};
		if(Programador.caller != Programador.getInstance)
		{
			console.log("No se puede instanciar el objeto");
		}
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