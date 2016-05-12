'use strict';
angular.module('Arduinode.Dispositivo',['Socket'])
.constant('DispositivoConfig',{
		rootFolder: 'js/modules/Dispositivo/'
})
.config(function( $stateProvider, $urlRouterProvider, DispositivoConfig )
{

	$stateProvider
		.state('dispositivos',
		{
			templateUrl: DispositivoConfig.rootFolder + "_dispositivos.html",
			controller: 'DispositivoCtrl'
		})
		.state('updateDispositivo',
		{
			params: { params: null },
			templateUrl: DispositivoConfig.rootFolder + "_form.html",
			controller: 'DispositivoFormCtrl'
		})
		.state('create',
		{
			templateUrl: DispositivoConfig.rootFolder + "_form.html",
			controller: 'DispositivoFormCtrl'
		})
})
.factory('DispositivoFct',
				 ['$rootScope',
				  '$http',
				  '$state',
				  'ngDialog',
		function(  $rootScope,
				   $http,
				   $state,
				   Popup)
		{
	var Dispositivo = {

		//Chequea si existen dispositivos en el caché
		hayDispositivosDisponibles: function()
		{
			if ( JSON.parse( localStorage.getItem("dispositivos") ).length > 0 )
			{
				return true;
			}
			else
			{
				$rootScope.currentMenu = 'Sin dispositivos';
				Popup.open(
				{
					template: '<h1>No hay dispositivos configurados</h1>',
					plain: true,
				});
			}
		},
		// Devuelve un dispositivo por ID
		get: function(params, callback)
		{
			this.getAll(function(models) {
				var dispositivos = models;
				if ( dispositivos.length > 0 ) {
					var disp = dispositivos.filter( function( disp) {
						//remover para produccion
						//return (disp.ip == '192.168.20.11');
						return (disp.ip == params.ip);
					});
					if (disp.length)
						callback(disp[0]);
				}
			});
		},
		// Devuelve todos los Dispositivos
		// Primero busca en caché, si está vacio, los pide al servidor
		// y los almacena en caché
		getAll: function(callback)
		{
			if (localStorage.getItem('dispositivos'))
			{
				callback(JSON.parse(localStorage.getItem("dispositivos")));
			}
			else
			{
				$http.get('/dispositivo/').then(function(response)
				{
					localStorage.setItem('dispositivos',JSON.stringify(response.data));
					callback(response.data || response);
				}, function(error)
				{
					callback(error)
				});
			}
		},
		// Elimina un dispositivo
		remove: function(id)
		{
			$http.get('/dispositivo/delete/'+id).then(function(response)
			{
				localStorage.removeItem('dispositivos');
				$state.go('dispositivos');

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
		// Crea o actualiza dispositivos
		save: function( dispositivo )
		{
			$http.post('/dispositivo/save/',dispositivo).then(function(response)
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
					localStorage.removeItem('dispositivos');
					$state.go('dispositivos');
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
	return Dispositivo;
}])
.controller('DispositivoCtrl',
			['$rootScope',
			 '$scope',
			 'DispositivoFct',
	function ($rootScope,
			  $scope,
			  Dispositivo)
	{
		$rootScope.currentMenu = 'Dispositivos';

		// Obtiene listado de dispositivos
		Dispositivo.getAll(function(dispositivos)
		{
			$scope.dispositivos = dispositivos;
		})
	}
])
.controller('DispositivoFormCtrl',
			['$stateParams',
			 '$scope',
			 'DispositivoConfig',
			 'DispositivoFct',
			 'ngDialog',
	function ($params,
			  $scope,
			  config,
			  Dispositivo,
			  Popup)
	{
		var params = $params.params;

		// Datos para el nuevo dispositivo
		$scope.model = {};

		// Edición de un dispositivo
		if (params && params.id_disp)
		{
			Dispositivo.get(params, function(model){
				$scope.model = model;
			});
		}

		// Guarda datos del dispositivo
		$scope.save = function(model)
		{
			if (!$scope.dispositivoForm.$invalid)
				Dispositivo.save(model);
		};

		// Elimina un dispositivo
		$scope.delete = function(id)
		{
			// Lanza popup para la confirmación de eliminar dispositivo
			Popup.openConfirm({
				template: config.rootFolder + "confirm_popup.html",
			}).then(function (success) {
				Dispositivo.remove(id);
			});
		}
	}
])
