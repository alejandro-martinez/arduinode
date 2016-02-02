angular.module('Arduinode.Tarea',['Arduinode.Salida','720kb.datepicker'])
.config(function( $stateProvider, $urlRouterProvider )
{

	$urlRouterProvider.otherwise("/");

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
			controller: 'FormCtrl',
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
		remove: function(id)
		{
			$http.get('/tarea/delete/'+id).then(function(response)
			{
				if (response.data && response.data.res === 1)
				{
					Popup.open({
						template:'<h1>Se eliminó la tarea</h1>',
						plain:true
					});
					$state.go('tarea');
				}
			}, function(error)
			{
				if (response.data)
				{
					Popup.open({
						template:'<h1>'+response.data+'</h1>',
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
		$scope.tareas = tareas;
	})
}])
.controller('FormCtrl', ['$scope','$rootScope','$stateParams','TareaFct','SwitchButton','ngDialog',
			function ( $scope, $rootScope, $params, Tarea, SwitchButton, Popup )
{
	$scope.getSwitchButton = function() { return SwitchButton.getTemplate() }
	$scope.diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves',
							'Viernes','Sabado','Domingo'];
	var defaultModel = { id_disp:0, nro_salida:0, dias_ejecucion:"" },
		params = $params.params || defaultModel;

	$rootScope.currentMenu = 'Edición de tareas';
	$scope.tarea = params;

	$('.clockpicker').clockpicker({ autoclose: true });
	$('#horainicio').val($scope.tarea.hora_inicio)
	$('#horafin').val($scope.tarea.hora_fin)
	params.dias_ejecucion = params.dias_ejecucion || "";
	$scope.tarea = params;

	$scope.save = function()
	{
		console.log($scope.tarea);
		$scope.tarea.hora_inicio = $('#horainicio').val();
		$scope.tarea.hora_fin = $('#horafin').val();
		Tarea.save( $scope.tarea, function(response){});
	}

	$scope.checkear_dia = function toggleSelection(key)
	{
		var dias = $scope.tarea.dias_ejecucion.split(",")
		var idx = dias.indexOf(key);
		(idx > -1) ? dias.splice(idx, 1) : dias.push(key);
		$scope.tarea.dias_ejecucion = dias.join(",");

	};
}])



