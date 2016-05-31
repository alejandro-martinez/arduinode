angular.module('Arduinode.Salida',['Socket','Arduinode.Dispositivo'])
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
			params: { page: null, disp: null },
			templateUrl:  SalidaConfig.rootFolder + "_estados.html",
			controller: 'EstadosCtrl'
		})
})
.factory('SalidaFct', ['$http','SocketIO','DispositivoFct',
	function($http, Socket, DispositivoFct)
{
	var Salida =
	{
		// Setea el estado de una salida
		accionar: function(params, callback)
		{
			Socket.send('accionarSalida',params);
			Socket.listen('accionarResponse', function(estado)
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
		save: function( salidaNew, callback)
		{
			var This = this;
			DispositivoFct.get(salidaNew, function(disp) {
				disp.salidas.forEach(function(s,k, _this) {
					if (s.nro_salida == salidaNew.nro_salida) {
						_this[k].note = salidaNew.note;
					}
				});
				callback( DispositivoFct.save(disp) );
			});
		},
		//Devuelve salida a partir de ip_dispositivo y nro_salida
		getSalida: function( params, callback ) {
			var This = this;
			DispositivoFct.get(params, function(disp) {
				if (disp.salidas.length) {
					var salida = This.findSalida(disp.salidas, params.nro_salida);
					callback(salida);
				}
			});
		}
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
		$scope.salidas = [];
		$('.clockpicker').clockpicker({autoclose: true});
		if (params.disp) {
			$scope.ipDispositivo = params.disp.ip;
			$scope.salidas = params.disp.salidas;
		}
		$scope.getSwitchButton = SwitchButton.getTemplate;
				numDispositivos = JSON.parse(localStorage.getItem("dispositivos")).length;
		$scope.processed = 0;
		$scope.buffer = [];
		$scope.salida = {};
		$rootScope.currentMenu = (params.page == 'SalidasEncendidas') ? 'Luces encendidas'
													  : 'Salidas de: ' + params.disp.note;
		$scope.showDescripcion = $scope.editing = true;
		$scope.showDispositivos = $scope.showSalidas = false;
		SocketIO.listen('salidas', function(salidas)
		{
			$scope.ipDispositivo = salidas[0].ip;
			$scope.salidas = (salidas.length)
						? salidas
						: params.disp.salidas;
			$scope.$digest();
		});
		SocketIO.listen('salidasEncendidas', function(salidas)
		{
			if (params.page == 'SalidasEncendidas') {
				i = 0;
				// Resetea el contador de dispositivos procesados
				// y el buffer de salidas recibidas
				if ($scope.processed == numDispositivos) {
					$scope.processed = 0;
					$scope.buffer = [];
				}
				//Flag para controlar que recibi datos de todos los dispositivos
				$scope.processed++;

				//Guardo en buffer las salidas recibidas
				salidas.forEach(function(s){ $scope.buffer.push(s) });

				var salidasAux = salidas;

				//Agrego progresivamente las salidas a la vista
				var promise = $interval(function(){
					if (i < salidasAux.length && salidasAux.length > 0) {
						$scope.salidas.push( salidasAux[i] );
						i++;
					}
					//Si recibi los datos de todos los dispositivos
					//Controlo que la cantidad de salidas activas
					//sea igual a las de la vista
					if ($scope.processed == numDispositivos) {
						$interval.cancel( promise );
						//Si la cantidad es distinta, actualizo
						if ( $scope.buffer.length != $scope.salidas.length ) {
							$scope.salidas = $scope.buffer;
						}
						$scope.salidas = orderByFilter($scope.salidas, '+note');
					}
				}, 100);
			}
		});

		SocketIO.send('getSalidas', {ip: $scope.ipDispositivo, page: params.page});

		//Accion sobre una salida (Luz, Persiana, Bomba)
		$scope.accionarSalida = function(data)
		{
			data.estado 	 = (data.estado == 0) ? 1 : 0;
			data.temporizada = $('.clockpicker').val();

			//Envia orden al socketArduino
			Salida.accionar( data, function(_estado)
			{
				data.estado = _estado;
			});
		}

		// Se dispara al hacer click en el titulo superior
		$scope.refresh = function()
		{
			SocketIO.send('getSalidas', {ip: $scope.ipDispositivo,page:  params.page});
		}

		//Abre popup para editar la descripcion de una salida
		$scope.edit = function(salida)
		{
			$scope.salida = salida;
			Popup.open({
				template: config.rootFolder+'_form.html',
				data: salida,
				scope: $scope
			});
		}

		//Guarda descripcion de salida editada
		$scope.save = function(salida)
		{
			$scope.salida.ip = $scope.ipDispositivo;
			Salida.save( $scope.salida, function(response)
			{
				Popup.close();
			});
		}

		//Escucha evento broadcast para actualizar estado de salidas
		SocketIO.listen('switchBroadcast', function(data) {
			console.log("Recibo broadcast",data)

			//Trae descripcion de la salida
			Salida.getSalida(data, function(salida) {
				// si la salida existe, cambia el estado, sino, agrega la salida
				salida[0].estado 	  = data.estado;
				salida[0].temporizada = data.temporizada;
				$scope.updateSalida( salida[0] );
			});
		})

		//Actualiza el estado de una salida específica
		$scope.updateSalida = function(params)
		{
			//Si la salida existe se actualiza el estado
			//remover para produccion
			//params.ip = '192.168.20.11';
			if ( Salida.findSalida($scope.salidas,params.nro_salida).length > 0 ) {
				$scope.salidas.forEach(function(s)
				{
					if (s.nro_salida == params.nro_salida
					 && s.ip == params.ip)
					{
						s.estado 		= params.estado;
						s.temporizada 	= params.temporizada;
					}
				});
				$scope.$digest();
			}
			//Agrego la salida
			else {
				$scope.salidas.push(params);
				$scope.$digest();
			}
		}

		/*$('.clockpicker').clockpicker({autoclose: true});
		var params = params.params || {},
			numDispositivos = JSON.parse(localStorage.getItem("dispositivos")).length;
		$scope.processed = 0;
		$scope.buffer = [];
		$scope.salida = {};
		$scope.page = (params.estado == 0) ? 'salidasActivas' : 'salidas';
		$scope.salidas = [];
		$rootScope.currentMenu = (params.estado == 0) ? 'Luces encendidas'
													  : 'Salidas de: ' + params.note;

		$scope.ipDispositivo = params.ip;
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.showDescripcion = $scope.editing = true;
		$scope.showDispositivos = $scope.showSalidas = false;

		//Escucha evento broadcast para actualizar estado de salidas
		SocketIO.listen('switchBroadcast', function(data) {
			console.log("Recibo broadcast")
			//Trae descripcion de la salida
			Salida.getSalida(data, function(salida) {
				// si la salida existe, cambia el estado, sino, agrega la salida
				salida[0].estado 	  = data.estado;
				salida[0].temporizada = data.temporizada;
				$scope.updateSalida( salida[0] );
			});
		})

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
			//Si la salida existe se actualiza el estado
			//remover para produccion
			//params.ip = '192.168.20.11';
			if ( Salida.findSalida($scope.salidas,params.nro_salida).length > 0 ) {
				$scope.salidas.forEach(function(s)
				{
					if (s.nro_salida == params.nro_salida
					 && s.ip == params.ip)
					{
						s.estado 		= params.estado;
						s.temporizada 	= params.temporizada;
					}
				});
				$scope.$digest();
			}
			//Agrego la salida
			else {
				$scope.salidas.push(params);
				$scope.$digest();
			}

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
		}*/
	}
])
