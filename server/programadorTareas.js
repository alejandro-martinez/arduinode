// Tarea programadas
schedule = require('node-schedule');
var socketArduino = require('./socketArduino')();

/* API
 * JOB
  invoke()
  runOnDate(date)
  schedule(date || recurrenceRule || cronstring)
  cancel(reschedule = false)
  cancelNext(reschedule = true)

   Property constraints
  name: readonly
  job: readwrite*/

module.exports = function()
{
	var Programador = {
		tareas: [],
		reprogramarTarea: function(tarea)
		{
			//Busco la tarea, y ejecuto la accion de apagado
			console.log("buscar tarea:",tarea.id_tarea);
			var _tarea = this.getTarea(tarea.id_tarea);

			//Extraigo la tarea final (0 = inicial, 1 = final)
			var tareaFinal = _tarea.tareaEnEjecucion[1];


		},
		getTarea: function(id)
		{
			var tarea = this.tareas.filter(function(t)
			{
				if (t.id_tarea == id)
				{
					return t;
				}
			})
			return tarea;
		},
		parseConfig: function(t)
		{
			var config = {
				id_tarea: t.id_tarea,
				accion: t.accion,
				ip_dispositivo: t.ip_dispositivo,
				nro_salida: t.nro_salida,
				dia_ini	: t.fecha_inicio.substr(-2),
				mes_ini	: t.fecha_inicio.substr(0,2),
				hora_ini: t.hora_inicio.substr(0,2),
				min_ini: t.hora_inicio.substr(-2),
				dias_ejecucion: t.dias_ejecucion.replace(/, +/g, ",").split(",").map(Number),
				dia_fin	: t.fecha_fin.substr(-2),
				mes_fin	: t.fecha_fin.substr(0,2),
				hora_fin: t.hora_fin.substr(0,2),
				min_fin	: t.hora_fin.substr(-2)
			}
			return config;
		},
		registerTareaActiva: function(config, tareaEnEjecucion)
		{

			var tarea = this.getTarea(config.id_tarea)[0];
			tarea.tareaEnEjecucion.push(tareaEnEjecucion);
			console.log(this.tareas[0]);
		},
		nuevaTarea: function(config)
		{
			var rule = new schedule.RecurrenceRule();
			rule.dayOfWeek = config.dias_ejecucion;
			rule.second = 0;
			var paramsDispositivo =
			{
				ip: config.ip_dispositivo,
				estado: config.accion,
				nro_salida: config.nro_salida
			}

			//Tarea inicial
			config.tarea = "inicial";
			if (this.checkValidez(config))
			{
				/*console.log("tarea inicio es valida");
				console.log("Deberia ejecutarse la accion",config.accion,
								" sobre la salida:",config.nro_salida,
								" del dispositivo: ",config.ip_dispositivo,
								" a las ",config.hora_ini,":",config.min_ini);*/
				rule.hour = parseInt(config.hora_ini);
				rule.minute = parseInt(config.min_ini);
				var tareaEnEjecucion = schedule.scheduleJob(rule, function()
				{
					console.log('Ejecutando tarea inicial');
					socketArduino.switchSalida(paramsDispositivo, function(response)
					{
						console.log("Switch response", response);
					})
				});
				this.registerTareaActiva(config, tareaEnEjecucion);
			}
			/*else
			{
				console.log("tarea inicial no valida");
			}*/

			//Tarea final
			config.tarea = "final";
			if (this.checkValidez(config))
			{
				/*console.log("tarea fin es valida");
				console.log("Deberia ejecutarse la accion",((config.accion == 1) ? 0 : 1),
								" sobre la salida:",config.nro_salida,
								" del dispositivo: ",config.ip_dispositivo,
								" a las ",config.hora_fin,":",config.min_fin);*/
				rule.hour = parseInt(config.hora_fin);
				rule.minute = parseInt(config.min_fin);
				schedule.scheduleJob(rule, function()
				{
					//La tarea final lleva accion opuesta a la inicial
					paramsDispositivo.estado = ((config.accion == 1) ? 0 : 1);
					console.log('Ejecutando tarea final');

					socketArduino.switchSalida(paramsDispositivo, function(response)
					{
						console.log("Switch response", response);
					})
				});
			}
			/*else
			{
				console.log("tarea final no valida");
			}*/
		},
		importar: function(_tareas)
		{
			var This = this;
			_tareas.forEach(function(t)
			{
				This.tareas.push({
					id_tarea: t.dataValues.id_tarea,
					data: t.dataValues,
					/*Aca guardo referencias a las tareas del Scheduler
					(inicial + final)*/
					tareaEnEjecucion: []
				})
			})
		},
		checkValidez: function(config)
		{
			var checkTareaInicial = function()
			{
				return true;
				//Tarea activa o desactivada
				if (config.activa)
				{
					console.log("Estado tarea inicial:",config.activa);
					//Tarea en rango de fecha valido?
					return checkRangoFecha(config);
				}
				return false;
			}
			var checkTareaFinal = function()
			{
				return true;
			}

			switch (config.tarea)
			{
				case "inicial":
					return checkTareaInicial();
					break;
				case "final":
					return checkTareaFinal();
					break;
			}

			var checkRangoFecha = function(config)
			{
				var fechaActual = new Date(),
					diaActual = parseInt(fechaActual.getDate()),
					mesActual = parseInt(fechaActual.getMonth());

				if (config.dia_ini >= diaActual && config.mes_ini >= mesActual)
				{
					if (config.dia_fin >= diaActual && config.mes_fin >= mesActual)
					{
						return true;
					}
				}
				return false;
			}
		},
		iniciarTodas: function()
		{
			var This = this;
			this.tareas.forEach(function(t)
			{
				//Armo la config de la tarea y Creo la tarea (inicial + final)
				var configTarea = This.parseConfig(t.data);
				This.nuevaTarea(configTarea);
			})
		},
		/*iniciar: function(id_tarea)
		{
			//Busco la tarea
			var tarea = this.tareas.filter(function(t)
			{
				return t.tarea.id_tarea == id_tarea;
			});

			if (tarea.length > 0)
			{

			}
		},*/
		//Detiene las tareas pasadas por param
		detener: function(tareas)
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
		}
	}
	return Programador;
}