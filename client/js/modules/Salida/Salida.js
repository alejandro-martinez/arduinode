angular.module('Arduinode.Salida',['Socket'])
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
		switchSalida: function(params, callback)
		{
			//Seteo el estado al que quiero cambiar la salida
			Socket.send('switchSalida',params);
			Socket.listen('switchResponse', function(estado)
			{
				callback(estado);
			});
		},
		findSalida: function(_array, nro_salida)
		{
			var salida = _array.filter(function(s)
			{
				return s.nro_salida == nro_salida;
			})
			return salida;
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
			Socket.listen('salidas', function(data)
			{
				callback(data);
			});
		},
		getSalidasActivas: function(callback)
		{
			Socket.send('getSalidasActivas');
			Socket.listen('salidasAux', function(salida)
			{
				callback(salida)
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
		save: function( salida, callback)
		{
			$http.post('/salida/save/', salida).then(function(response)
			{
				localStorage.removeItem('dispositivos');
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
.controller('SalidaCtrl', ['$stateParams','SwitchButton','SalidaConfig','$rootScope',
			'ngDialog','DispositivoFct','$scope','SalidaFct',
	function (params,SwitchButton,config,$rootScope, Popup,Dispositivo,
			  $scope,Salida)
	{
		var params = params.params || {};
		$scope.models = {};
		$rootScope.currentMenu = params.descripcion || '';
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.showDispositivos = $scope.showSalidas = true;
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
.controller('EstadosCtrl', ['SalidaConfig','DispositivoFct','SwitchButton',
			'$rootScope','$stateParams','ngDialog','$scope', 'SalidaFct',
	function (config,Dispositivo,SwitchButton,$rootScope,params, Popup,
			  $scope, Salida)
	{
		$('.clockpicker').clockpicker({donetext: 'OK'});
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
			data.estado_orig = data.estado;
			data.ip = data.ip || $scope.ipDispositivo;
			data.estado = (data.estado == 0) ? 1 : 0;
			var tiempo = $('.clockpicker').val();
			data.temporizada = (tiempo != '') ? tiempo : null;

			Salida.switchSalida( data, function(_estado)
			{
				$('.clockpicker').val("");
				data.estado = _estado;
				$scope.updateSalida(data);
			});
		}

		$scope.updateSalida = function(params)
		{
			$scope.salidas.forEach(function(s)
			{
				if (s.nro_salida == params.nro_salida)
				{
					s.estado = params.estado;
					$scope.$apply();
				}
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
			$scope.salidas = [];
			$rootScope.loading = true;
			$rootScope.currentMenu = "Luces encendidas";
			Salida.getSalidasActivas(function(salida)
			{
				$rootScope.loading = false;
				if (salida.length > 0)
				{
					console.log(salida);
					$scope.salidas = $scope.salidas.concat(salida);
				}
				$scope.$apply();
			});
		}

		$scope.refreshEstados = function()
		{
			$rootScope.loading = true;
			Salida.getSalidasArduino(
			{
				ip		: $scope.ipDispositivo,
				id_disp : params.id_disp
			},
			function(data)
			{
				$rootScope.loading = false;
				$scope.ipDispositivo = data.ip;
				$scope.salidas = data.salidas;
				$scope.$apply();

			});
		}
		$scope.refresh = function()
		{
			if (params.estado == 0)
			{
				$scope.refreshLucesEncendidas();
			}
			else
			{
				$scope.refreshEstados();
			}
		}
		$scope.refresh();
	}
])
