angular.module('Arduinode.Tarea',['Arduinode.Dispositivo','Arduinode.Salida'])
.config(function( $stateProvider, $urlRouterProvider )
{
	$stateProvider
		.state('tareas',
		{
			templateUrl: "js/modules/Tarea/index.html",
			controller: 'TareaCtrl'
		})
		.state('editarTarea',
		{
			params: { params: null },
			controller: 'TareaFormCtrl',
			templateUrl: "js/modules/Tarea/_form.html"
		})
})
.factory('TareaFct',
		['$http',
		 '$state',
		 'SocketIO',
		 'ngDialog',
function($http,
		 $state,
		 SocketIO,
		 Popup)
{
	var Tarea = {

		// Obtiene listado de tareas
		getAll: function(callback)
		{
			// Escucha evento que se dispara si alguien crea o modifica una tarea,
			// si esto sucede borra el cache para reflejar los cambios
			SocketIO.listen('tareasChanged', function()
			{
				localStorage.setItem('tareas', undefined);
			});

			// Chequea si hay tareas en el caché
			if ( localStorage.getItem('tareas'))
			{
				callback(JSON.parse(localStorage.getItem("tareas")));
			}
			else
			{
				// Pide tareas al servidor
				$http.get('/tareas/').then(function(response)
				{
					localStorage.setItem('tareas',JSON.stringify(response.data));
					callback(response.data || response);

				}, function(error)
				{
					callback(error)
				});
			}
		},
		// Elimina una tarea
		remove: function( tarea )
		{
			$http.post('/tarea/delete',{tarea: tarea}).then(function(response)
			{
				if (response.data == null)
				{
					localStorage.removeItem('tareas');
					$state.go('tareas');
				}
			}, function(error)
			{
				if (error)
				{
					Popup.open({
						template:'<h1>'+error+'</h1>',
						plain:true
					});
				}
			});
		},
		// Guarda una tarea
		save: function( tarea, callback )
		{
			$http.post('/tarea/save/',tarea).then(function(response)
			{
				localStorage.removeItem('tareas');
				if (response.data && response.data.error)
				{
					Popup.open({
						template:'<h1>' + response.data.error	+ '</h1>',
						plain:true
					});
				}
				else
				{
					$state.go('tareas');
					if (callback)
					{
						callback();
					}
				}
			}, function(error)
			{
				Popup.open({
					template:'<h1>' + error	+ '</h1>',
					plain:true
				});
			});
		}
	}
	return Tarea;
}])
.controller('TareaCtrl',
				['$rootScope',
				 '$scope',
				 'TareaFct',
				 'DispositivoFct',
		function ($rootScope,
				  $scope,
				  Tarea,
				  Dispositivo )
		{
		$rootScope.currentMenu = "Tareas programadas";
		$scope.tareas = []

		// Chequea si existen dispositivos
		$scope.sinDispositivos = Dispositivo.hayDispositivosDisponibles();

		// Carga listado de tareas
		$scope.loadTareas = function()
		{
			Tarea.getAll(function(tareas)
			{
				$scope.tareas = tareas;
			})
		}

		$scope.loadTareas();

		// Duplica una tarea
		$scope.duplicateTarea = function(tarea)
		{
			// Setea la fecha de la tarea duplicada
			tarea.isNew = true;
			tarea.dia_inicio = tarea.dia_fin;
			tarea.mes_inicio = tarea.mes_fin;

			// Guarda la tarea y refresca
			Tarea.save(tarea, function(res)
			{
				$scope.loadTareas();
			});
		}
}])
.controller('TareaFormCtrl',
			['$scope',
			 '$rootScope',
			 '$stateParams',
			 'DispositivoFct',
			 'SalidaFct',
			 'TareaFct',
			 'ngDialog',
		function ( $scope,
				   $rootScope,
				   $params,
				   Dispositivo,
				   Salida,
				   Tarea,
				   Popup )
	{
	$scope.diasSemana = ['Domingo','Lunes', 'Martes', 'Miercoles',
							'Jueves','Viernes','Sabado'];

	$scope.mesesTxt = ["Enero", "Febrero", "Marzo", "Abril",
						"Mayo", "Junio", "Julio","Agosto", "Septiembre",
						"Octubre", "Noviembre", "Diciembre"];

	// Devuelve true si el par (dia/mes) es valido
	var dia_valido = function(dia, mes) {
		var fecha = new Date();
		fecha.setMonth(parseInt(mes) - 1);
		fecha.setDate(parseInt(dia));
		return (fecha.getDate() == parseInt(dia) && fecha.getMonth() == parseInt(mes)-1);
	}

	// Devuelve objeto Date a partir de un String (ej; '14:59')
	var parseHour = function(horaStr) {
		var date = new Date();
		return new Date(date.getFullYear(),
						date.getMonth(),
						date.getDate(),
						horaStr.substr(0,2),
						horaStr.substr(-2));
	}

	// Modelo por defecto para nuevas tareas
	var def_model = {
		id_tarea: 9999,
		dias_ejecucion:"1,2,3,4,5",
		dispositivos:[],
		mes_inicio: 1,
		mes_fin: 12,
		duracion: "",
		dia_inicio: 1,
		dia_fin: 1,
		accion: 0,
		activa: 1,
		isNew: true
	}

	var params 				   = $params.params || def_model;
	$rootScope.currentMenu 	   = 'Edición de tareas';
	$scope.dispositivoSelected = {};
	$scope.tarea 			   = params;
	$scope.tarea.dispositivosEliminados = [];
	$scope.tarea.mes_inicio    = params.mes_inicio - 1;
	$scope.tarea.mes_fin 	   = params.mes_fin - 1;
	$scope.dias 			   = [];
	$scope.meses 			   = [];

	// Setea la acción que debe realizar la tarea sobre las salidas
	// Encender o apagar
	$scope.switch = function(data)
	{
		$scope.tarea.accion = ($scope.tarea.accion == 0) ? 1 : 0;
	}

	// Cambia a "Activa" o "Inactiva" la tarea
	$scope.setActiva = function(activa)
	{
		$scope.tarea.activa = ($scope.tarea.activa == 0) ? 1 : 0;
	}

	// Llena los selects Dia y Mes
	for (i = 1; i < 32; i++)
	{
		$scope.dias.push(i);
		if (i < 13)
		{
			$scope.meses.push(i - 1);
		}
	}

	$scope.tarea = params;

	// Configura el componente para seleccionar horario y duracion
	$('.clockpicker').clockpicker({ autoclose: true });
	$('#horainicio').val( $scope.tarea.hora_inicio )
	$('#duracion').val( $scope.tarea.duracion );

	// Llena el select de dispositivos
	$scope.loadSelect = function()
	{
		Dispositivo.getAll(function(dispositivos)
		{
			$scope.dispositivos = dispositivos;
		});
	}

	// Solicita todos los dispositivos existentes
	Dispositivo.getAll(function(dispositivos)
	{
		// Añade descripciones de dispositivos y sus salidas
		dispositivos.forEach(function(j)
		{
			$scope.tarea.dispositivos.forEach(function(e)
			{
				if (j.ip == e.ip)
				{
					e.note = j.note;
					e.salidaNote = Salida.findSalida( j.salidas,
														e.nro_salida)[0].note;
				}
			});
		})
		$scope.dispositivos = dispositivos;
	});

	// Se dispara al elegir un dispositivo desde el select
	$scope.changeDispositivo = function()
	{
		// Busca el dispositivo en la lista y carga sus salidas
		// en el combo de salidas
		var disp = $scope.dispositivos.filter(function(e)
		{
			if (e.id_disp == $scope.dispositivoSelected.id_disp)
			{
				$scope.salidas = e.salidas;
				return e;
			}
		});
	}

	// Validacion de la tarea
	$scope.isModelValid = function()
	{
		var model = $scope.tarea;
		$scope.errors = [];
		if (model.dispositivos.length == 0)
		{
			$scope.errors.push("No se vinculó ningun dispositivo a la tarea");
		}
		if (model.dias_ejecucion.length == 0)
		{
			$scope.errors.push("No se seleccionaron los dias de ejecucion");
		}
		if (model.dia_inicio.length == 0 || model.dia_fin.length == 0)
		{
			$scope.errors.push("No se seleccionaron los dias de inicio/fin");
		}
		if (model.hora_inicio.length == 0)
		{
			$scope.errors.push("No se seleccionó la hora de ejecución");
		}
		if (model.duracion.length == 0 && model.accion == 0)
		{
			$scope.errors.push("No se seleccionó duración de la tarea");
		}
		if (!dia_valido(model.dia_inicio, model.mes_inicio)) {
			$scope.errors.push("Dia / Mes inválido para la tarea");
		}
		return $scope.errors.length == 0;
	}

	// Guarda una tarea nueva
	$scope.save = function()
	{
		// Parseo de fechas
		$scope.tarea.hora_inicio = $('#horainicio').val();
		$scope.tarea.duracion 	 = $('#duracion').val();
		$scope.tarea.dia_inicio  = $('#dia_inicio').val();
		$scope.tarea.mes_inicio  = parseInt( $('#mes_inicio').val() ) + 1;
		$scope.tarea.dia_fin  	 = $('#dia_fin').val();
		$scope.tarea.mes_fin  	 = parseInt( $('#mes_fin').val() ) + 1;

		// Si los datos son validos
		if ($scope.isModelValid())
		{
			Tarea.save( $scope.tarea );
		}
		else
		{
			Popup.open({
				template: "js/modules/Tarea/form_errors.html",
				data: $scope.errors
			});
		}
	}

	//Calcula la hora de fin de tarea en base a hora inicio y duración
	$scope.calcularHoraFinalTarea = function()
	{
		$scope.tarea.hora_inicio = $('#horainicio').val();
		$scope.tarea.duracion 	 = $('#duracion').val();

        if ($scope.tarea.duracion)
		{
			var date = new Date(),
				hora_i = parseHour($scope.tarea.hora_inicio),
				duracion = parseHour($scope.tarea.duracion);

			date.setTime(hora_i.getTime());
			date.setTime(date.getTime() + duracion.getTime());

			// UTC parse
			date.setHours(date.getHours() - 3);
			$scope.tarea.hora_fin = date;
		}
    };

	// Elimina una tarea
	$scope.deleteTarea = function()
	{
		Tarea.remove( $scope.tarea );
	}

	// Control de checkbox de selección de dias de ejecución
	$scope.checkear_dia = function(key)
	{
		var dias = $scope.tarea.dias_ejecucion.split(","),
			idx = dias.indexOf(String(key));
		(idx > -1) ? dias.splice(idx, 1) : dias.push(key);
		$scope.tarea.dias_ejecucion = dias.join(",");
	};

	//Vincula nuevo dispositivo a la tarea
	$scope.addDispositivo = function()
	{
		var dispositivo = {
			note	  : $scope.dispositivoSelected.note,
			ip		  : $scope.dispositivoSelected.ip,
			nro_salida: $scope.tarea.nro_salida,
			salidaNote: Salida.findSalida($scope.dispositivoSelected.salidas,
										  $scope.tarea.nro_salida)[0].note
		}
		// Añade dispositivo a la lista superior
		$scope.tarea.dispositivos.push( dispositivo );
	}

	//Remueve un dispositivo de la tarea
	$scope.removeDispositivo = function(disp)
	{
		$scope.tarea.dispositivos.forEach(function(_disp, index)
		{
			if (_disp == disp)
			{
				$scope.tarea.dispositivosEliminados.push(_disp);
				$scope.tarea.dispositivos.splice(index,1);
			}
		})
	}
}])
