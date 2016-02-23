// Tarea programadas
schedule = require('node-schedule');
var socketArduino = require('../Arduino')(),
	DateConvert = require('../utils/DateConvert')();

var Programador = function()
{
		this.tareas = [];
		this.reprogramarTarea = function(_tarea)
		{
			console.log("Reprogramando tarea")
			//Busco la tarea,
			this.quitarTarea(_tarea[0].id_tarea);
			console.log("Ejecutando tarea con accion de apagado");
			//y ejecuto la accion de apagado
			_tarea[0].estado = 1;
			this.ejecutarTarea(_tarea[0]);
			this.importar();
		};
		this.quitarTarea = function(id_tarea)
		{
			console.log("Quitando tarea");
			var tarea = this.getTarea(id_tarea)[0];
			tarea.enEjecucion = null;
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
				ip_dispositivo: t.ip_dispositivo,
				nro_salida: 	t.nro_salida,
				dia_ini	: 		DateConvert.fechaADia( t.fecha_inicio ),
				mes_ini	: 		DateConvert.fechaAMes( t.fecha_inicio ),
				hora_ini: 		t.hora_inicio.substr(0,2),
				min_ini: 		t.hora_inicio.substr(-2),
				raw_hora_inicio:t.hora_inicio,
				dias_ejecucion: DateConvert.strToArray(t.dias_ejecucion),
				dia_fin	: 		DateConvert.fechaADia( t.fecha_fin ),
				mes_fin	: 		DateConvert.fechaAMes( t.fecha_fin ),
				duracion: 		DateConvert.horario_a_min( t.duracion ),
				raw_duracion: 	t.duracion
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

			var paramsDispositivo =
			{
				ip: config.ip_dispositivo,
				estado: config.accion,
				nro_salida: config.nro_salida,
				duracion: config.duracion
			}
			console.log("Forzando ejecucion de tarea",config.raw_hora_inicio);

			if (this.checkValidez(config))
			{
				this.forzarEjecucion(config);
			}
			else
			{
				console.log("La tarea a forzar no es valida",config);
			}

			var job = schedule.scheduleJob(rule, function()
			{
				if (This.checkValidez(config))
				{
					This.ejecutarTarea(paramsDispositivo);
				}
				else
				{
					console.log("no valida");
				}
			});
			this.registerTareaActiva(config, job);
		};
		this.importar = function()
		{
			var This = this;
			This.tareas = DataStore.getTareas();
			This.cargarTodas();
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
			var hora_fin_min =
					DateConvert.sumarHoras(t.raw_hora_inicio, t.raw_duracion),
					tiempo_desde_inicio = DateConvert.difHoraConActual(t.raw_hora_inicio) * 60;
					hora_fin_HHMM = DateConvert.min_a_horario(hora_fin_min);

			//Si Hora actual > hora_inicio de tarea
			if (tiempo_desde_inicio < t.duracion)
			{
				t.estado = 0;
				t.temporizada = DateConvert.aMin( t.duracion - tiempo_desde_inicio );
				this.ejecutarTarea(t);
			}
			else
			{
				console.log("La tarea no deberia estar ejecutandose en este momento");
			}
		};
		this.ejecutarTarea = function(params)
		{
			params.noError = true;
			socketArduino.switchSalida(params, function(response)
			{
				if (response === null)
					console.log("ERROR: No se puede llegar a:",params.ip);
			})
		};
		this.cargarTodas = function()
		{
			var This = this;
			this.tareas.forEach(function(t)
			{
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