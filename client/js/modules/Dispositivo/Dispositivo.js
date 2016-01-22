'use strict';
angular.module('Arduinode.Dispositivo',['Socket','ImgNotes'])
.constant('DispositivoConfig',{
		rootFolder: 'js/modules/Dispositivo/'
})
/*
.config(['$routeProvider','DispositivoConfig', function ($routeProvider,config)
{
	/*$routeProvider
		.when('/dispositivo/',
		{
			templateUrl: config.rootFolder+'_dispositivos.html',
			controller: 'DispositivoCtrl'
		})
		.when('/dispositivo/create',
		{
			templateUrl: config.rootFolder+'_form.html',
			controller: 'FormCtrl'
		})
		.when('/dispositivo/update/:id_disp',
		{
			templateUrl: config.rootFolder+'_form.html',
			controller: 'FormCtrl'
		})
		.otherwise(
		{
			redirectTo: '/'
		});
}])*/
.config(function( $stateProvider, $urlRouterProvider )
{

	$stateProvider
		.state('dispositivos',
		{
			templateUrl: "js/modules/Dispositivo/_dispositivos.html",
			controller: 'DispositivoCtrl'
		})
		.state('update',
		{
			params: {
				params: null
			},
			templateUrl: "js/modules/Dispositivo/_form.html",
			controller: 'FormCtrl'
		})
		.state('create',
		{
			templateUrl: "js/modules/Dispositivo/_form.html",
			controller: 'FormCtrl'
		})

})
.factory('DispositivoFct', ['$http','$state','ngDialog', function($http,$state, Popup)
{
	var Dispositivo = {
		getAll: function(callback)
		{
			$http.get('/dispositivo/').then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
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
				if (response.data && response.data.res === 1)
				{
					Popup.open({
						template:'<h1>Se eliminó el dispositivo</h1>',
						plain:true
					});
					$state.go('dispositivos');
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
.controller('DispositivoCtrl', ['$rootScope','$scope','ImgNotesFct', 'SocketIO','DispositivoFct',
	function ($rootScope,$scope,ImgNotes, Socket, Dispositivo)
	{
		$rootScope.currentMenu = 'Dispositivos';
		Dispositivo.getAll(function(dispositivos)
		{
			$scope.dispositivos = dispositivos;
		})
	}
])
.controller('FormCtrl', ['$stateParams','$scope','SocketIO','DispositivoFct',
	function (params, $scope, Socket, Dispositivo)
	{
		console.log(params.params);
		var params = params.params;
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
