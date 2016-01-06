angular.module('Arduinode.Salida',['Socket','ImgNotes'])
.constant('SalidaConfig',{
		rootFolder: 'js/modules/Salida/'
})
.config(['$routeProvider','SalidaConfig', function ($routeProvider,config)
{
	$routeProvider
		.when('/salida/estados/:id_disp/:ip', {
			templateUrl: config.rootFolder+'_estados.html',
			controller: 'EstadosCtrl'
		})
		.when('/salida/:route', {
			templateUrl: config.rootFolder+'_salidas.html',
			controller: 'SalidaCtrl'
		})
		.otherwise(
		{
			redirectTo: '/'
		});
}])
.factory('SalidaFct', ['$http','SocketIO', function($http, Socket)
{
	var Salida = {
		getAll: function(callback)
		{
			$http.get('/salida').then(function(response)
			{
				callback(response)
			}, function(err)
			{
				callback(error)
			});
		},
		toggle: function(ip, nro_salida, callback)
		{
			Socket.send('toggleSalida',{ip: ip, salida: nro_salida});
		},
		getSalidasArduino: function(ip, callback)
		{
			console.log(ip);
			Socket.send('getSalidas',ip);
			Socket.listen('salidas', function(salidas)
			{
				callback(salidas);
			});
		},
		delete: function(id, callback)
		{
			$http.get('/salida/delete/'+id).then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
		},
		get: function(id, callback)
		{
			$http.get('/salida/id/'+id).then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
		},
		//Consulta los estados de las salidas del dispositivo
		getEstados: function( id_disp, callback )
		{
			Socket.send('S'+id_disp);
			Socket.listen('estados', function(estados)
			{
				callback(estados);
			});
		},
		save: function( salida, callback)
		{
			$http.post('/salida/save/', salida).then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
		},
	}
	return Salida;
}])
.factory('SwitchButton',['SalidaConfig', function(config)
{
	var Factory = {
		getTemplate: function()
		{
			return config.rootFolder + '_switchButton.html';
		}
	}
	return Factory;
}])
.controller('SalidaCtrl', ['SwitchButton','SalidaConfig','$rootScope','$routeParams',
			'ngDialog','DispositivoFct','$scope','ImgNotesFct','SalidaFct',
	function (SwitchButton,config,$rootScope,$routeParams, Popup,Dispositivo, $scope,ImgNotes, Salida)
	{
		var This = this;
		$rootScope.currentMenu = 'Plano: ' + $routeParams.route;
		$scope.models = {};
		$scope.loaded = false;
		console.log(SwitchButton);
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$('#image').attr('src',"/image/planos_p" + $routeParams.route + ".jpg");

		Salida.getAll(function(models)
		{
			$scope.models = models.data;
			$scope.tag = $('#image').imgNotes();
			ImgNotes.init( $scope );
			ImgNotes.setMarkers( $scope.models );
		});

		Dispositivo.getAll(function(dispositivos)
		{
			$scope.dispositivos = dispositivos;
		});

		$(document).off('ImgNotesEditing').on('ImgNotesEditing', function(e, note)
		{
			$scope.editing = true;
			$scope.salida = note;
			$scope.salida.x = note.relx;
			$scope.salida.y = note.rely;
			Popup.open(
			{
				template: config.rootFolder+'_form.html',
				scope: $scope
			});
		});

		$(document).off('ImgNotesShow').on('ImgNotesShow', function(e, note)
		{
			note.dispositivo = $scope.dispositivos.filter(function(e)
			{
				if (e.id_disp == note.id_disp)
					return e;
			});
			Popup.open(
			{
				template: config.rootFolder+'_view.html',
				data: note
			});
		});

		$(document).off('ImgNotesClick').on('ImgNotesClick', function(e,note)
		{
			if ($scope.canEdit)
			{
				$scope.salida = note;
				Popup.open(
				{
					template: config.rootFolder+'_form.html',
					scope: $scope
				});
			}
		});
		$scope.delete = function(id)
		{
			Salida.delete(id, function(r)
			{
				Popup.close();
				if (r.res === 1)
				{
					ImgNotes.deleteMarker();
				}
			})
		}
		$scope.save = function()
		{
			Salida.save($scope.salida, function(r)
			{
				Popup.close();
				$scope.toggleEdit();
				if (r.res == 'created')
				{
					ImgNotes.addMarker(r.model);
				}
				ImgNotes.refreshMarker($scope.salida.note);
			});
		};
	}
])
.controller('EstadosCtrl', ['SalidaConfig','SwitchButton','$rootScope','$routeParams','ngDialog','$scope', 'SalidaFct',
	function (config,SwitchButton,$rootScope,$routeParams, Popup, $scope, Salida)
	{
		var This = this;
		$scope.ipDispositivo = $routeParams.ip;
		$rootScope.currentMenu = 'Salidas del dispositivo: ' + $scope.ipDispositivo;
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.toggle = function(nro_salida, estado)
		{
			Salida.toggle($scope.ipDispositivo,nro_salida);
		}
		Salida.getSalidasArduino($scope.ipDispositivo,function(salidas)
		{
			$scope.salidas = salidas;
			$scope.$apply();
		});

	}
])
