'use strict';
angular.module('Arduinode.Dispositivo',['Socket'])
.constant('DispositivoConfig',{
		rootFolder: 'js/modules/Dispositivo/'
})
.config(function( $stateProvider, $urlRouterProvider )
{

	$stateProvider
		.state('dispositivos',
		{
			templateUrl: "js/modules/Dispositivo/_dispositivos.html",
			controller: 'DispositivoCtrl'
		})
		.state('updateDispositivo',
		{
			params: {
				params: null
			},
			templateUrl: "js/modules/Dispositivo/_form.html",
			controller: 'DispositivoFormCtrl'
		})
		.state('create',
		{
			templateUrl: "js/modules/Dispositivo/_form.html",
			controller: 'DispositivoFormCtrl'
		})

})
.factory('DispositivoFct', ['$http','$state','ngDialog', function($http,$state, Popup)
{
	var Dispositivo = {
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
		get: function(id, callback)
		{
			$http.get('/dispositivo/id/'+id).then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
		},
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
.controller('DispositivoCtrl', ['$rootScope','$scope', 'SocketIO','DispositivoFct',
	function ($rootScope,$scope,Socket, Dispositivo)
	{
		$rootScope.currentMenu = 'Dispositivos';
		Dispositivo.getAll(function(dispositivos)
		{
			$scope.dispositivos = dispositivos;
		})
	}
])
.controller('DispositivoFormCtrl', ['$stateParams','$scope','SocketIO','DispositivoFct',
	function ($params, $scope, Socket, Dispositivo)
	{
		var params = $params.params;
		$scope.model = {};

		if (params && params.id_disp)
		{
			Dispositivo.get(params.id_disp, function(model)
			{
				$scope.model = model[0];
			});
		}

		$scope.save = function(model)
		{
			if (!$scope.dispositivoForm.$invalid)
				Dispositivo.save(model);
		};

		$scope.delete = function(id)
		{
			Dispositivo.remove(id);
		}
	}
])
