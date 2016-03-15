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
			params: {
				params: null
			},
			controller: 'TareaFormCtrl',
			templateUrl: "js/modules/Tarea/_form.html"
		})
})
.factory('TareaFct', ['$http','$state','ngDialog',function($http,$state, Popup)
{
	var Tarea = {
		getAll: function(callback)
		{
			if ( localStorage.getItem('tareas'))
			{
				callback(JSON.parse(localStorage.getItem("tareas")));
			}
			else
			{
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
		remove: function(tarea)
		{
			$http.post('/tarea/delete/',tarea).then(function(response)
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
.controller('TareaCtrl', ['$rootScope','$scope','TareaFct','DispositivoFct',
		function ($rootScope,$scope, Tarea, Dispositivo )
{
	$rootScope.currentMenu = "Tareas programadas";
	$scope.tareas = []
	$scope.sinDispositivos = Dispositivo.hayDispositivosDisponibles();

	$scope.loadTareas = function()
	{
		Tarea.getAll(function(tareas)
		{
			$scope.tareas = tareas;
		})
	}
	$scope.loadTareas();
	$scope.duplicateTarea = function(tarea)
	{
		tarea.id_tarea = -1;
		tarea.dia_inicio = tarea.dia_fin;
		tarea.mes_inicio = tarea.mes_fin;
		Tarea.save(tarea, function(res)
		{
			$scope.loadTareas();
		});
	}

}])
.controller('TareaFormCtrl', ['$scope','$rootScope','$stateParams',
			'DispositivoFct','SalidaFct','TareaFct','ngDialog',
			function ( $scope, $rootScope, $params, Dispositivo, Salida,
					   Tarea, Popup )
{
	$scope.diasSemana = ['Domingo','Lunes', 'Martes', 'Miercoles', 'Jueves','Viernes','Sabado'];

	$scope.mesesTxt = ["Enero", "Febrero", "Marzo", "Abril",
					   "Mayo", "Junio", "Julio","Agosto", "Septiembre",
					   "Octubre", "Noviembre", "Diciembre"];

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
		activa: 1
	}

	var params = $params.params || def_model;
	$rootScope.currentMenu = (params.id_tarea != 9999) ? 'Edición de tareas' : 'Nueva tarea';
	$scope.dispositivoSelected = {};
	$scope.tarea = params;
	$scope.tarea.dispositivosEliminados = [];
	$scope.tarea.mes_inicio = params.mes_inicio - 1;
	$scope.tarea.mes_fin 	= params.mes_fin - 1;
	$scope.dias 			= [];
	$scope.meses 			= [];

	$scope.switch = function(data)
	{
		$scope.tarea.accion = ($scope.tarea.accion == 0) ? 1 : 0;
	}

	$scope.setActiva = function(activa)
	{
		$scope.tarea.activa = ($scope.tarea.activa == 0) ? 1 : 0;
	}

	for (i = 1; i < 32; i++)
	{
		$scope.dias.push(i);
		if (i < 13)
		{
			$scope.meses.push(i - 1);
		}
	}

	$scope.tarea = params;
	$('.clockpicker').clockpicker({ autoclose: true });
	$('#horainicio').val( $scope.tarea.hora_inicio )
	$('#duracion').val( $scope.tarea.duracion );

	Dispositivo.getAll(function(dispositivos)
	{
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

	$scope.loadSelect = function()
	{
		Dispositivo.getAll(function(dispositivos)
		{
			$scope.dispositivos = dispositivos;
		});
	}

	$scope.changeDispositivo = function()
	{
		var disp = $scope.dispositivos.filter(function(e)
		{
			if (e.id_disp == $scope.dispositivoSelected.id_disp)
			{
				$scope.salidas = e.salidas;
				return e;
			}
		});
	}
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
		return $scope.errors.length == 0;
	}
	$scope.save = function()
	{
		$scope.tarea.hora_inicio = $('#horainicio').val();
		$scope.tarea.duracion 	 = $('#duracion').val();
		$scope.tarea.dia_inicio  = $('#dia_inicio').val();
		$scope.tarea.mes_inicio  = parseInt( $('#mes_inicio').val() ) + 1;
		$scope.tarea.dia_fin  	 = $('#dia_fin').val();
		$scope.tarea.mes_fin  	 = parseInt( $('#mes_fin').val() ) + 1;
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

	$scope.calcularHoraFinalTarea = function()
	{
		$scope.tarea.hora_inicio = $('#horainicio').val();
		$scope.tarea.duracion 	 = $('#duracion').val();
        if ($scope.tarea.duracion)
		{
			var date = new Date();
			var hora_i = new Date(date.getFullYear(),
								  date.getMonth(),
								  date.getDate(),
								  $scope.tarea.hora_inicio.substr(0,2),
								  $scope.tarea.hora_inicio.substr(-2));

			var duracion = new Date(date.getFullYear(),
								  date.getMonth(),
								  date.getDate(),
								  $scope.tarea.duracion.substr(0,2),
								  $scope.tarea.duracion.substr(-2));

			date.setTime(hora_i.getTime());
			date.setTime(date.getTime() + duracion.getTime());
			date.setHours(date.getHours() - 3);
			$scope.tarea.hora_fin = date;
		}
    };

	$scope.deleteTarea = function()
	{
		Tarea.remove( $scope.tarea );
	}

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
			note: $scope.dispositivoSelected.note,
			ip: $scope.dispositivoSelected.ip,
			nro_salida: $scope.tarea.nro_salida,
			salidaNote: Salida.findSalida($scope.dispositivoSelected.salidas,
										  $scope.tarea.nro_salida)[0].note
		}
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
