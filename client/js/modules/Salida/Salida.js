angular.module('Arduinode.Salida',['Socket'])
.constant('SalidaConfig',{ rootFolder: 'js/modules/Salida/' })
.config(function( $stateProvider, $urlRouterProvider, SalidaConfig )
{
	// Definicion de rutas y paths
	$urlRouterProvider.otherwise("/");

	$stateProvider
		.state('salidas',
		{
			params: { params: null },
			templateUrl: SalidaConfig.rootFolder + "_salidas.html",
			controller: 'SalidaCtrl'
		})
		.state('estados',
		{
			params: { params: null },
			templateUrl:  SalidaConfig.rootFolder + "_estados.html",
			controller: 'EstadosCtrl'
		})
})
.factory('SalidaFct', ['$http','SocketIO', function($http, Socket)
{
	var Salida =
	{
		// Setea el estado de una salida
		switchSalida: function(params, callback)
		{
			Socket.send('switchSalida',params);
			Socket.listen('switchResponse', function(estado)
			{
				callback(estado);
			});
		},
		// Busca una salida en un array
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
		// Guarda descripcion de una salida
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
	// Devuelve template de boton para una salida segun el tipo
	// Luz o persiana
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
.controller('SalidaCtrl',
			['$rootScope',		//Se usa para cambiar el titulo de la pagina
			 '$scope',
			 '$stateParams',	//Parametros pasados al controlador
			 'ngDialog',		//Para mostrar mensajes en Popup
			 'SwitchButton',	//Control del boton de switch de la salida
			 'SalidaConfig',	//Constantes de path
			 'DispositivoFct',	//Funciones de Dispositivo
			 'SalidaFct',		//Funciones de Salida
	function ($rootScope,
			  $scope,
			  params,
			  Popup,
			  SwitchButton,
			  config,
			  Dispositivo,
			  Salida )
	{
		var params = params.params || {};
		$scope.models = {};
		$rootScope.currentMenu = params.descripcion || '';
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.showDispositivos = $scope.showSalidas = true;
	}
])
// Se ejecuta cuando terminó de renderizarse un ng-repeat
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
// Filtra items en base a una clave para evitar duplicados
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
.controller('EstadosCtrl',
			['$rootScope',		//Se usa para cambiar el titulo de la pagina
			 '$scope',
			 '$timeout',		//Para ejecutar algo luego de x tiempo
			 '$interval',		//Para ejecutar algo cada x tiempo
			 'SalidaConfig',	//Constantes de path
			 'orderByFilter',	//Para ordenar items por clave en un ng-repeat
			 '$stateParams',	//Parametros pasados al controlador
			 'SocketIO',		//SocketIO para comunicarme con el servidor
			 'DispositivoFct',	//Funciones de Dispositivo
			 'SwitchButton',	//Control del boton de switch de la salida
			 'SalidaFct',		//Funciones de Salida
			 'ngDialog',		//Para mostrar mensajes en Popup
	function ( $rootScope,
			   $scope,
			   $timeout,
			   $interval,
			   config,
			   orderByFilter,
			   params,
			   SocketIO,
			   Dispositivo,
			   SwitchButton,
			   Salida,
			   Popup )
	{
		$('.clockpicker').clockpicker({autoclose: true});
		var params = params.params || {};
		$scope.salida = {};
		$scope.page = (params.estado == 0) ? 'salidasActivas' : 'salidas';

		$rootScope.currentMenu = (params.estado == 0) ? 'Luces encendidas'
													  : 'Salidas de: ' + params.note;

		$scope.ipDispositivo = params.ip;
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.showDescripcion = $scope.editing = true;
		$scope.showDispositivos = $scope.showSalidas = false;

		//Abre popup para editar la descripcion de una salida
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

		//Guarda descripcion de salida editada
		$scope.save = function(salida)
		{
			$scope.salida.id_disp = params.id_disp;
			Salida.save( $scope.salida, function(response)
			{
				Popup.close();
			});
		}

		//Accion sobre una salida (on / off)
		$scope.switch = function(data)
		{
			data.estado_orig = data.estado;
			data.ip 		 = data.ip || $scope.ipDispositivo;
			data.estado 	 = (data.estado == 0) ? 1 : 0;
			var tiempo 		 = $('.clockpicker').val();
			data.temporizada = (tiempo != '') ? tiempo : null;

			//Envia orden al socketArduino
			Salida.switchSalida( data, function(_estado)
			{
				data.estado = _estado;
				$scope.updateSalida(data);
			});
		}

		//Actualiza el estado de una salida específica
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
				//Muestra estado de boton indicando la accion
				//de subir o bajar la persiana
				var boton = $('#'.concat(nro_salida,action));
				$('.active').removeClass('active');
				boton.addClass('active');

				//Espera 3 segundos y resetea el estado del boton
				setTimeout(function()
				{
 					boton.removeClass('active');
				}, 3000);
			});
		}

		// El servidor envia listado de luces encendidas
		// a) cuando alguien acciona una salida
		// b) cuando se pide listado de luces encendidas

		SocketIO.listen('salidasActivas', function(salidas)
		{
			//Solo refresco si estoy en luces encendidas

			$scope.salidas = [];
			var i = 0;
			//Agrego progresivamente las salidas cada 1 segundo
			//para no atorar la vista
			$interval(function(){
				if (i < salidas.length && salidas.length > 0) {

					$scope.salidas.push(salidas[i]);
					i++;
				}
			}, 1000);
		});

		// Escucha evento cuando el servidor envia listado de salidas
		// en la pagina "Salidas del dispositivo x"
		SocketIO.listen('salidas', function(data)
		{
			$scope.ipDispositivo = data.ip;
			$scope.salidas 		 = data.salidas;
			$scope.$digest();
		});

		// Solicita listado de salidas en la pagina "salidas del dispositivo x"
		$scope.refreshEstados = function()
		{
			SocketIO.send('getSalidas',{ip: $scope.ipDispositivo, id_disp: params.id_disp});
		}

		// Determina que funcion usar para actualizar en base a la pagina actual
		$scope.refreshSalidas = {
			salidasActivas: function() {
				SocketIO.send('getSalidasActivas');
			},
			salidas: $scope.refreshEstados
		}

		// Se dispara al hacer click en el titulo superior
		$scope.refresh = function()
		{
			$scope.refreshSalidas[ $scope.page ]();
		}

		// Ordena las salidas activas alfabeticamente de forma ascendente
		// al actualizar la pagina Luces encendidas
		$scope.onEnd = function(){
			$timeout(function(){
				$scope.salidas = orderByFilter($scope.salidas, '+note');
			}, 50);
		};

		// Solo si existen dispositivos, refresca pagina actual al inicio
		if (Dispositivo.hayDispositivosDisponibles() )
		{
			$scope.refresh();
		}
	}
])
