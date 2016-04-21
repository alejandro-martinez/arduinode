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
.directive("repeatEnd", function(){
	return {
		restrict: "A",
		link: function (scope, element, attrs) {
			if (scope.$last) {
				scope.$eval(attrs.repeatEnd);
			}
		}
	};
})
.filter('unique', function() {
   return function(collection, keyname) {
      var output = [],
          keys = [];

      angular.forEach(collection, function(item) {
          var key = item[keyname];
          if(keys.indexOf(key) === -1) {
              keys.push(key);
              output.push(item);
          }
      });

      return output;
   };
})
.controller('EstadosCtrl', ['SocketIO','orderByFilter','$timeout','SalidaConfig','DispositivoFct','SwitchButton',
			'$rootScope','$stateParams','SalidaFct','ngDialog','$scope', '$interval','SalidaFct',
	function (SocketIO,orderByFilter, $timeout,config,Dispositivo,SwitchButton,$rootScope,params,SalidaFct, Popup,
			  $scope, $interval, Salida)
	{
		$('.clockpicker').clockpicker({autoclose: true});
		var params = params.params || {};
		$scope.salida = {};
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
				data.estado = _estado;
				$scope.updateSalida(data);
			});
		}

		$scope.updateSalida = function(params)
		{
			$scope.salidas.forEach(function(s)
			{
				if (s.nro_salida == params.nro_salida
					&& s.ip == params.ip)
				{
					s.estado = params.estado;
					$scope.$digest();
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
		SocketIO.listen('salidasAux', function(salidas)
		{
			$scope.salidas = [];
			var i = 0;

			//Agrego progresivamente las salidas
			$interval(function(){

				if (i < salidas.length && salidas.length > 0) {

					$scope.salidas.push(salidas[i]);

					i++;
				}
			}, 1000);

		});
		$scope.refreshLucesEncendidas = function()
		{
			SocketIO.send('getSalidasActivas');



			/*Salida.getSalidasActivas(function(salidas) {


			});*/
		}

		$scope.refreshEstados = function()
		{
			Salida.getSalidasArduino(
			{
				ip		: $scope.ipDispositivo,
				id_disp : params.id_disp
			},
			function(data)
			{
				$scope.ipDispositivo = data.ip;
				$scope.salidas = data.salidas;
				$scope.$digest();
			});
		}

		$scope.refresh = function()
		{
			console.log("Refresh")
			if (params.estado == 0)
			{
				if ($rootScope.currentMenu != "Luces encendidas") {
					$rootScope.currentMenu = "Luces encendidas";
				}
				$scope.refreshLucesEncendidas();
			}
			else
			{
				$scope.refreshEstados();
			}
		}

		//Ordena las salidas activas alfabeticamente de forma ascendente
		$scope.onEnd = function(){
			$timeout(function(){
				$scope.salidas = orderByFilter($scope.salidas, '+note');
			}, 1);
		};

		if (Dispositivo.hayDispositivosDisponibles() )
		{
			$scope.refresh();
		}


	}
])
