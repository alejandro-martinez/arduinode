angular.module('Arduinode.Dispositivo',['Socket','ImgNotes'])
.config(['$routeProvider', function ($routeProvider)
{
	$routeProvider
		.when('/dispositivo/', 
		{
			templateUrl: 'js/modules/Dispositivo/_dispositivos.html',
			controller: 'DispositivoCtrl'
		})
		.when('/dispositivo/create', 
		{
			templateUrl: 'js/modules/Dispositivo/_form.html',
			controller: 'FormCtrl'
		})
		.when('/dispositivo/update/:id_disp', 
		{
			templateUrl: 'js/modules/Dispositivo/_form.html',
			controller: 'FormCtrl'
		})
		.otherwise(
		{		
			redirectTo: '/'
		});
}])
.factory('DispositivoFct', ['$http','ngDialog', function($http, Popup)
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
		delete: function(id)
		{
			$http.get('/dispositivo/delete/'+id).then(function(response)
			{
				if (response.data && response.data.res === 1)
				{
					Popup.open({
						template:'<h1>Se eliminó el dispositivo</h1>',
						plain:true
					});
					window.location.href = '/#/dispositivo';
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
				Popup.open({
					template:'<h1>Se ' + (response.data === 1) ? "creó" : "modificó"
					+ ' el dispositivo</h1>',
					plain:true
				});
				window.location.href = '/#/dispositivo';
			}, function(error)
			{
				callback(error)
			});
		}
	}
	return Dispositivo;
}])
.controller('DispositivoCtrl', ['$scope','ImgNotesFct', 'SocketIO','DispositivoFct',
	function ($scope,ImgNotes, Socket, Dispositivo)
	{
		/*	s = io(window.location.origin);
			s.emit({'param': 'G'});
			s.on('data', function(data){
				console.log('Estado:' + data);
			});
		*/
		Dispositivo.getAll(function(dispositivos)
		{
			$scope.dispositivos = dispositivos;
		})
	}
])
.controller('FormCtrl', ['$routeParams','$scope','SocketIO','DispositivoFct',
	function ($routeParams, $scope, Socket, Dispositivo)
	{
	/*	s = io(window.location.origin);
		s.emit({'param': 'G'});
		s.on('data', function(data){
			console.log('Estado:' + data);
		});
	*/
		$scope.model = {};
		//actualización
		if ($routeParams.id_disp) 
		{
			Dispositivo.get($routeParams.id_disp, function(model)
			{
				$scope.model = model;
			});
		}
		
		$scope.save = function(model)
		{
			Dispositivo.save(model);
		};

		$scope.delete = function(id)
		{
			Dispositivo.delete(id);
		}
	}
])
