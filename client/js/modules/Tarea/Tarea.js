angular.module('Arduinode.Tarea',['Arduinode.Dispositivo','Arduinode.Salida','720kb.datepicker'])
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
.factory('TareaFct', ['$http','$state','ngDialog', function($http,$state, Popup)
{
	var Tarea = {
		getAll: function(callback)
		{
			$http.get('/tareas/').then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
		},
		get: function(id, callback)
		{
			$http.get('/tarea/id/'+id).then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
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
				console.log("posttarea",response)
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
		console.log("tareas",tareas);
		$scope.tareas = tareas;
	})
}])
.controller('TareaFormCtrl', ['$scope','$rootScope','$stateParams',
			'DispositivoFct','SalidaFct','TareaFct','SwitchButton','ngDialog',
			function ( $scope, $rootScope, $params, Dispositivo, Salida,
					   Tarea, SwitchButton, Popup )
{
	console.log("params",$params.params);

	$scope.getSwitchButton = function() { return SwitchButton.getTemplate() }
	$scope.diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves',
							'Viernes','Sabado','Domingo'];
	var params = $params.params || { id_tarea: 9999, dias_ejecucion:"", dispositivos:[]};
	$rootScope.currentMenu = (params.id_tarea != 9999) ? 'Edición de tareas' : 'Nueva tarea';
	$scope.dispositivoSelected = {};
	$scope.tarea = params;

	Dispositivo.getAll(function(dispositivos)
	{
			dispositivos.forEach(function(j)
			{
				$scope.tarea.dispositivos.forEach(function(e)
				{
					if (j.ip == e.ip)
					{
						e.note = j.note;
						console.log(j.salidas)
						e.salidaNote = Salida.findSalida(j.salidas,e.nro_salida)[0].note;
					}
				});
			})
		console.log("disp tarea",$scope.tarea.dispositivos)

		$scope.dispositivos = dispositivos;

	});
/*	else
	{
		Dispositivo.get(params.id_disp, function(model)
		{
			console.log("Model",model);
			$scope.dispositivos = model;
			$scope.dispositivoSelected = model[0];

			$scope.salidas = Salida.findSalida(model[0].salidas, $scope.tarea.nro_salida);;
		});
	}*/
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
	console.log("A setear",params);

	$scope.tarea = params;
	$('.clockpicker').clockpicker({ autoclose: true });
	$('#horainicio').val($scope.tarea.hora_inicio)
	$('#duracion').val($scope.tarea.duracion)

	$scope.validateModel = function()
	{
		return true;
	}
	$scope.save = function()
	{
		$scope.tarea.hora_inicio = $('#horainicio').val();
		$scope.tarea.duracion = $('#duracion').val();
		$scope.tarea.accion = 0;

		if ($scope.validateModel())
		{
			Tarea.save( $scope.tarea, function(response){});
		}
	}

	$scope.deleteTarea = function()
	{
		Tarea.remove( $scope.tarea );
	}

	$scope.checkear_dia = function(key)
	{
		console.log("key",key);
		var dias = $scope.tarea.dias_ejecucion.split(",")
		console.log("dias",dias);
		var idx = dias.indexOf(String(key));
		console.log("idx",idx);
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
			salidaNote: Salida.findSalida($scope.dispositivoSelected.salidas, $scope.tarea.nro_salida)[0].note
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



