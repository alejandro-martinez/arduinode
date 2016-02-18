// Tarea programadas
schedule = require('node-schedule');
var socketArduino = require('./Arduino')(),
DateConvert = require('./utils/DateConvert')();

var Programador = function()
{
		this.tareas = [];
		this.reprogramarTarea = function(_tarea)
		{
			console.log("Reprogramando tarea", _tarea.id_tarea)
			//Busco la tarea,
			this.quitarTarea(_tarea.id_tarea);
			console.log("Apagando");
			//y ejecuto la accion de apagado
			_tarea.estado = 1;
			this.ejecutarTarea(_tarea);
			console.log("Reimportando");
			this.importar();
		};
		this.quitarTarea = function(id_tarea)
		{
			console.log("Quitando tarea");
			var tarea = this.getTarea(id_tarea)[0];
			tarea.enEjecucion.job = null;
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
			console.log("Registrando tarea");
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
			}/*
			console.log("tarea inicio es valida");
			console.log("Deberia ejecutarse la accion",config.accion,
						" sobre la salida:",config.nro_salida,
						" del dispositivo: ",config.ip_dispositivo,
						" a las ",config.hora_ini,":",config.min_ini);*/
			console.log("Forzando ejecucion de tarea",config.raw_hora_inicio);

			if (this.checkValidez(config))
			{
				this.forzarEjecucion(config);
			}

			var job = schedule.scheduleJob(rule, function()
			{
				if (This.checkValidez(config))
				{
					console.log("Ejecutando Tarea");
					This.ejecutarTarea(paramsDispositivo);
				}
				else
				{
					console.log("no valida");
				}
			});
			console.log("registrando tarea");
			this.registerTareaActiva(config, job);
		};
		this.importar = function()
		{
			var This = this;
			sequelize.models.tareas.findAll().then(function(_tareas)
			{
				This.tareas = _tareas;
				console.log("Cantidad de tareas",This.tareas.length);
				This.cargarTodas();
			});
		};
		this.checkValidez = function(config)
		{
			//Tarea activa o desactivada
			if (config.activa)
			{
				return DateConvert.fechaBetween(config);
			}
			return false;
		};
		this.forzarEjecucion = function(config)
		{
// 			console.log("raw inicio",config.raw_hora_inicio);
			var hora_fin_min =
					DateConvert.sumarHoras(config.raw_hora_inicio, config.raw_duracion),
				tiempo_ejecutada = DateConvert.difHoraConActual(config.raw_hora_inicio);

			var hora_fin_HHMM = DateConvert.min_a_horario(hora_fin_min);

			console.log("Pasaron ",tiempo_ejecutada," min desde: ",config.raw_hora_inicio)

			//Si Hora actual > hora_inicio de tarea
			if (tiempo_ejecutada  > 0 )
			{
				console.log("Deberia ejecutarse si horaActual < hora_fin_tarea");
				if ( DateConvert.mayorAHoraActual(hora_fin_min) )
				{
// 					console.log("Hora actual es < a hora_fin tarea");
// 					console.log("Significa que deberia estar ejecutandose");
					var tiempo_restante = DateConvert.difHoraConActual( hora_fin_HHMM );
//  					console.log("Tiempo restante",tiempo_restante);
					//Ejecuto la tarea con tiempo_restante
					config.estado = 0;
					config.duracion = tiempo_restante;
					this.ejecutarTarea(config);
				}
			}
		};
		this.ejecutarTarea = function(params)
		{
			socketArduino.switchSalida(params, function(response)
			{
				console.log("Switch response", response);
			})
		};
		this.cargarTodas = function()
		{
			var This = this;
			this.tareas.forEach(function(t)
			{
				//Armo la config de la tarea y Creo la tarea
				var configTarea = This.parseConfig(t.dataValues);
				This.nuevaTarea(configTarea);
			})
		};
		//Detiene las tareas pasadas por param
		this.detener = function(tareas)
		{
			var This = this;
			tareas.forEach(function(t)
			{
				This.tareas.forEach(function(s)
				{
					if (t == s.tarea.id_tarea)
					{

					}
				});
			})
		};
		if(Programador.caller != Programador.getInstance)
		{
			console.log("This object cannot be instanciated");
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