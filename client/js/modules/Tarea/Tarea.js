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
.factory('TareaFct', ['$http','$state','ngDialog','$window',function($http,$state, Popup, $window)
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
		save: function( tarea )
		{
			$http.post('/tarea/save/',tarea).then(function(response)
			{
				if (response.data && response.data.error)
				{
					Popup.open({
						template:'<h1>' + response.data.error	+ '</h1>',
						plain:true
					});
				}
				else
				{
					localStorage.removeItem('tareas');
					$state.go('tareas');
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
.controller('TareaCtrl', ['$rootScope','$scope','TareaFct',
		function ($rootScope,$scope, Tarea )
{
	$rootScope.currentMenu = "Tareas programadas";
	$scope.tareas = []
	Tarea.getAll(function(tareas)
	{
		console.log("Tareas",tareas);
		$scope.tareas = tareas;
	})
}])
.controller('TareaFormCtrl', ['$scope','$rootScope','$stateParams',
			'DispositivoFct','SalidaFct','TareaFct','SwitchButton','ngDialog',
			function ( $scope, $rootScope, $params, Dispositivo, Salida,
					   Tarea, SwitchButton, Popup )
{
	$scope.getSwitchButton = function() { return SwitchButton.getTemplate() }
	$scope.diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves',
							'Viernes','Sabado','Domingo'];

	$scope.mesesTxt = ["Enero", "Febrero", "Marzo", "Abril",
					   "Mayo", "Junio", "Julio","Agosto", "Septiembre",
					   "Octubre", "Noviembre", "Diciembre"];
	var def_model = {
		id_tarea: 9999,
		dias_ejecucion:"",
		dispositivos:[],
		fecha_inicio: "",
		fecha_fin: ""
	}

	var params = $params.params || def_model;

	$rootScope.currentMenu = (params.id_tarea != 9999) ? 'Edición de tareas' : 'Nueva tarea';
	$scope.dispositivoSelected = {};
	$scope.tarea = params;
	$scope.dias = [];
	$scope.meses = [];
	$scope.getSwitchButton = SwitchButton.getTemplate;

	$scope.switch = function(data)
	{
		$scope.tarea.accion = ($scope.tarea.accion == 0) ? 1 : 0;
	}

	for (i = 1; i < 32; i++)
	{
		$scope.dias.push(i);
		if (i < 13)
		{
			$scope.meses.push(i - 1);
		}
	}
	Dispositivo.getAll(function(dispositivos)
	{
			dispositivos.forEach(function(j)
			{
				$scope.tarea.dispositivos.forEach(function(e)
				{
					if (j.ip == e.ip)
					{
						e.note = j.note;
						e.salidaNote = Salida.findSalida( j.salidas,e.nro_salida)[0].note;
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

	$scope.tarea = params;
	$('.clockpicker').clockpicker({ autoclose: true });
	$('#horainicio').val( $scope.tarea.hora_inicio )
	$('#duracion').val( $scope.tarea.duracion )
	$('#hora_apagado').val( $scope.tarea.hora_apagado )

	$scope.save = function()
	{
		$scope.tarea.dia_inicio  	= $('#dia_inicio').val();
		$scope.tarea.mes_inicio  	= $('#mes_inicio').val();
		$scope.tarea.hora_inicio 	= $('#horainicio').val();
		$scope.tarea.hora_apagado	= $('#hora_apagado').val();
		$scope.tarea.duracion 	 	= $('#duracion').val();
		Tarea.save( $scope.tarea, function(response){});
	}

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
				$scope.tarea.dispositivos.splice(index,1);
			}
		})
	}
}])



