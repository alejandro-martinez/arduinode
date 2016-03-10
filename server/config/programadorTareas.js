// Tarea programadas
schedule = require('node-schedule');
var socketArduino = require('../Arduino')(),
	DateConvert = require('../utils/DateConvert')();

var Programador = function()
{
		this.tareas = [];
		this.reprogramarTarea = function(_tareaOld)
		{
			this.getTarea(_tareaOld.id_tarea);
			this.apagarTarea(_tareaOld);
			this.quitarTarea(_tareaOld.id_tarea);
			this.importar();
		};
		this.findDeletedDispositivo = function(_tareaOld)
		{
			/*b.forEach(function(d)
			{
				_tareaOld.dispositivos.map(function(s){
					console.log(s.a == d.a)
				})
			});*/
		};
		this.quitarTarea = function(id_tarea)
		{
			var tarea = this.getTarea(id_tarea)[0];
			if (tarea && tarea.hasOwnProperty('enEjecucion'))
			{
				tarea.enEjecucion = null;
			}
		},
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
				descripcion: 	t.descripcion
			}
			return config;
		};
		this.registerTareaActiva = function(config, _tarea)
		{
			var tarea = this.getTarea(config.id_tarea)[0];

			tarea.enEjecucion = _tarea;
		};
		this.nuevaTarea = function(config)
		{
			var This = this;
			var rule = new schedule.RecurrenceRule();
				rule.dayOfWeek = config.dias_ejecucion;
				rule.second = 0;
				rule.hour = parseInt(config.hora_ini);
				rule.minute = parseInt(config.min_ini);

			console.log("Forzando ejecucion de tarea",config.descripcion);

			if (this.checkValidez(config))
			{
				this.forzarEjecucion(config);
			}
			else
			{
				console.log("La tarea a forzar no es valida",config.descripcion);
			}

			var job = schedule.scheduleJob(rule, function()
			{
				if (This.checkValidez(config))
				{
					This.ejecutarTarea(config);
				}
				else
				{
					console.log(config.descripcion, " no es valida");
				}
			});

			this.registerTareaActiva(config, job);

		};
		this.importar = function()
		{
			this.tareas = DataStore.getTareas();
			this.cargarEnScheduler();
		};
		this.checkValidez = function(config)
		{
			//Tarea activa o no?
			if (config.activa)
			{
				return DateConvert.fechaBetween(config);
			}
			return false;
		};
		this.forzarEjecucion = function(t)
		{
			var hora_fin_min = DateConvert.sumarHoras(t.raw_hora_inicio, t.raw_duracion),
				hora_fin_HHMM = DateConvert.min_a_horario(hora_fin_min),
				hora_actual_HHMM = DateConvert.horarioEnHHMM();

			//Si hora_inicio de tarea + duracion tarea > hora_actual
			//Se deberia ejecutar la tarea
			if (DateConvert.horaActualBetween( t.raw_hora_inicio, hora_fin_HHMM ))
			{
				var tiempo_restante = DateConvert.restarHoras(hora_actual_HHMM,hora_fin_HHMM);
				console.log("Tiempo restante de ",t.descripcion,DateConvert.min_a_horario(tiempo_restante));

				if (tiempo_restante > 0)
				{
					console.log("Ejecutando la tarea forzada",t.descripcion);
					t.estado = t.accion;
					t.temporizada = tiempo_restante;
					this.ejecutarTarea(t);
				}
			}
		};
		this.ejecutarTarea = function(params)
		{
			if (params.hasOwnProperty('dispositivos'))
			{
				params.dispositivos.forEach(function(d)
				{
					d.noError = true;
					d.estado = params.accion;
					d.temporizada = params.temporizada;

					socketArduino.switchSalida(d, function(response)
					{
						console.log("El dispositivo respondio:",response);
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
			console.log("Observando las tareas cada 5 minutos...");
			//Cada 5 min
			setInterval(function()
			{
				This.tareas.forEach(function(t)
				{
					var tiempo_desde_inicio = DateConvert.difHoraConActual(t.hora_inicio);
					var tiempo_restante = DateConvert.horario_a_min(t.duracion) - tiempo_desde_inicio;
					if (tiempo_restante > 0 && t.accion == 0)
					{
						//Relanzo la tarea con el tiempo restante
						console.log("Relanzando tarea: ",t.descripcion
									," con tiempo restante de:",tiempo_restante);
						t.estado = t.accion;
						t.temporizada = tiempo_restante;
						This.ejecutarTarea(t);
					}
					else
					{
						console.log(t.descripcion, " no deberia estar en ejecucion");
					}
				})
			},60000 * 5)
		};
		this.apagarTarea = function(tarea)
		{
			tarea.estado = 1;
			this.ejecutarTarea(tarea);
		};
		this.cargarEnScheduler = function()
		{
			var This = this;
			this.tareas.forEach(function(t)
			{
				This.apagarTarea(t.id_tarea);
				console.log("Importando ",This.tareas.length, " tarea/s");
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


/* ************************************************************************
SINGLETON CLASS DEFINITION
************************************************************************ */
Programador.instance = null;

/**
 * Singleton getInstance definition
 * @return singleton class
 */
Programador.getInstance = function(){
    if(this.instance === null){
        this.instance = new Programador();
    }
    return this.instance;
}

module.exports = Programador.getInstance();