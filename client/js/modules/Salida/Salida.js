angular.module('Arduinode.Salida',['Socket','ImgNotes'])
.constant('SalidaConfig',{
		rootFolder: 'js/modules/Salida/'
})
.config(function( $stateProvider, $urlRouterProvider )
{

	$urlRouterProvider.otherwise("/");

	$stateProvider
		.state('salidas',
		{
			params: {
				params: null
			},
			templateUrl: "js/modules/Salida/_salidas.html",
			controller: 'SalidaCtrl'
		})
		.state('estados',
		{
			params: {
				params: null
			},
			templateUrl: "js/modules/Salida/_estados.html",
			controller: 'EstadosCtrl'
		})
})
.factory('SalidaFct', ['$http','SocketIO', function($http, Socket)
{
	var Salida =
	{
		getAll: function(id_planta,callback)
		{
			$http.get('/salida/'+id_planta).then(function(response)
			{
				callback(response)
			}, function(err)
			{
				callback(error)
			});
		},
		switchSalida: function(params, callback)
		{
			console.log("params",params.estado);

			//Seteo el estado al que quiero cambiar la salida
			params.estado = (params.estado == 'off') ? 0 : 1;
			Socket.send('switchSalida',params);
			Socket.listen('switchResponse', function(estado)
			{
				callback(estado);
				Socket.listen('switchResponse',function(){});
			});
		},
		movePersiana: function(params, callback)
		{
			Socket.send('movePersiana',params);
			Socket.listen('moveResponse', function(response)
			{
				callback(response);
			});
		},
		getSalidasArduino: function(params, callback)
		{
			Socket.send('getSalidas',params);
			Socket.listen('salidas', function(salidas)
			{
				callback(salidas);
			});
		},
		getSalidasActivas: function(callback)
		{
			Socket.send('getSalidasActivas');
			Socket.listen('salidasActivas', function(salidas)
			{
				console.log("salidas activas",salidas);
				callback(salidas);
			});
		},
		deleteSalida: function(id, callback)
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
		getByPlanta: function(id, callback)
		{
			Socket.send('getSalidasPlanta', id);
			Socket.listen('salidasPlanta', function(salidas)
			{
				console.log("Get by planta",salidas);
				callback(salidas);
			});
		},
		getSalidasDisponibles: function(todas, ocupadas)
		{
			var salidasOcupadas = function(id_disp,nro)
			{
				var found = $.grep(ocupadas, function (item) {
					return item.id_disp == id_disp && item.nro_salida==nro;
				});
				return found;
			}

			var salidasDisponibles = todas.filter(function(s)
			{
				var found = salidasOcupadas(s.id_disp,s.nro_salida);
				if (found.length === 0)
				{
					return s;
				}
			});

			return salidasDisponibles;
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
	var Factory =
	{
		getTemplate: function(tipo)
		{
			var tpl = (tipo == 'P') ? '_switchWindow' : '_switchButton';
			return config.rootFolder.concat(tpl,".html");
		}
	}
	return Factory;
}])
.factory('CombineRequestsFct', ['$http', function($http)
{
	var Request =
	{
		getDispositivoAndSalida: function(params, callback){
			$http.post('/mediator/dispositivoAndSalida/',params).then(function(response)
			{
				callback(response.data || response);
			}, function(error)
			{
				callback(error)
			});
		}
	}
	return Request;
}])
.directive('selectdispositivos', function() {
  return {
    restrict: 'A',
    replace: true,
	//require:'ngModel',
	scope: {
	  selected: '=selected',
	  salida: '=salida',
	  data: '=data',
      dispositivo: '=dispositivo'
    },
    templateUrl: 'js/modules/Salida/_select.html',
	controller: 'SelectCtrl'
  };
})
.controller('SalidaCtrl', ['$stateParams','SwitchButton','SalidaConfig','$rootScope',
			'ngDialog','DispositivoFct','$scope','ImgNotesFct','SalidaFct',
	function (params,SwitchButton,config,$rootScope, Popup,Dispositivo,
			  $scope,ImgNotes, Salida)
	{
		var params = params.params || {};
		$scope.models = {};
		$rootScope.currentMenu = params.descripcion || '';
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.showDispositivos = $scope.showSalidas = true;

		$scope.changeDispositivo = function()
		{
			var disp = $scope.dispositivos.filter(function(e)
			{
				if (e.id_disp == $scope.disp.id_disp)
				{
					return e;
				}
			});
			Salida.getSalidasArduino( disp[0], function(salidas)
			{
				$rootScope.loading = false;
				//Actualiza combo de salidas
				//para quitar las que ya fueron agregadas
				$scope.salidas = Salida.getSalidasDisponibles(salidas, ImgNotes.getMarkers());
				$scope.$apply();
			});

		}
	}
])
.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit('ngRepeatFinished');
                });
            }
        }
	}
})
.controller('EstadosCtrl', ['SalidaConfig','DispositivoFct','SwitchButton','$rootScope','$stateParams','ngDialog','$scope', 'SalidaFct',
	function (config,Dispositivo,SwitchButton,$rootScope,params, Popup, $scope, Salida)
	{
		$('.clockpicker').clockpicker();
		var params = params.params || {};
		$scope.salida = {};
		$rootScope.loading = true;
		$rootScope.currentMenu = 'Salidas de: ' + params.note;

		$scope.ipDispositivo = params.ip;
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.showDescripcion = $scope.editing = true;
		$scope.showDispositivos = $scope.showSalidas = false;

		$scope.edit = function(salida)
		{
			$scope.salida = salida;
			Popup.open(
			{
				template: config.rootFolder+'_form.html',
				data: salida,
				scope: $scope
			});
		}
		$scope.save = function(salida)
		{
			$scope.salida.id_disp = params.id_disp;
			Salida.save( $scope.salida, function(response)
			{
				Popup.close();
			});
		}
		$scope.switch = function(data)
		{
			var tiempo = $('.clockpicker').val();
			if (tiempo != '')
			{
				data.duracion = tiempo;
				data.estado = 'off';
			}
			Salida.switchSalida( data, function(_estado)
			{
				$scope.refreshEstados();
			});
		}
		//Funcionamiento Persianas
		$scope.move = function(ip, nro_salida, action)
		{
			var params = {
				ip: $scope.ipDispositivo || ip,
				action: action,
				nro_salida: nro_salida
			}
			Salida.movePersiana(params, function(_response)
			{
				var boton = $('#'.concat(nro_salida,action));
				$('.active').removeClass('active');
				boton.addClass('active');
				setTimeout(function()
				{
 					boton.removeClass('active');
				}, 3000);

			});
		}

		$scope.refreshLucesEncendidas = function()
		{
			$rootScope.loading = true;
			$rootScope.currentMenu = "Luces encendidas";
			Salida.getSalidasActivas(function(salidas)
			{
				$rootScope.loading = false;
				$scope.salidas = salidas;
				$scope.$apply();
			});
		}
		$scope.refreshEstados = function()
		{
			$('.clockpicker').val("");
			Salida.getSalidasArduino(
			{
				ip		: $scope.ipDispositivo,
				id_disp : params.id_disp
			},
			function(salidas)
			{
				if (salidas[salidas.length-1].error)
				{
					$rootScope.currentMenu = salidas[salidas.length-1].error;
				}
				$rootScope.loading = false;
				$scope.salidas = salidas;
				$scope.$apply();
			});
		}
		if (params.estado == 'on')
		{
			$scope.refreshLucesEncendidas();
		}
		else
		{
			$scope.refreshEstados();
		}
	}
])
