angular.module('Arduinode.Salida',['Socket','Arduinode.Dispositivo'])
.constant('SalidaConfig',{
	rootFolder: 'js/modules/Salida/',
	ON: 0,
	OFF: 1
})
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
				if (callback)
				{
					callback(estado);
				}
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
			 'SalidaConfig',	//Constantes
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
			   Popup,
			   Estados
			   )
	{
		$('.clockpicker').clockpicker({ autoclose: true });
		var dispositivo 	= params.disp,
			numDispositivos = JSON.parse(localStorage.getItem("dispositivos")).length,
			processed 		= 0,
			buffer 			= [];

		angular.extend($scope, {
			salidas: dispositivo.salidas || [],
			getSwitchButton: SwitchButton.getTemplate,
			salida: {},
			editing: true,
			showDescripcion: true,
			showSalidas: false,
			showDispositivos: false
		});

		//Setea titulo de pagina
		if (params.page == 'SalidasEncendidas') {
			$rootScope.currentMenu = 'Luces encendidas';
		}
		else {
			$rootScope.currentMenu = 'Salidas de: ' + dispositivo.note;
		}

		//Pide salidas segun pagina seleccionada (encendidas o todas)
		SocketIO.send('getSalidas', {ip: dispositivo.ip, page: params.page});
		SocketIO.listen('salidas', function(salidas)
		{
			dispositivo.ip = salidas[0].ip;
			$scope.salidas = (salidas.length)
						   ? salidas
						   : dispositivo.salidas;
			$scope.$digest();
		});

		//Recibe listado de salidas encendidas
		SocketIO.listen('salidasEncendidas', function(salidas)
		{
			if (params.page == 'SalidasEncendidas') {
				i = 0;
				// Resetea el contador de dispositivos procesados
				// y el buffer de salidas recibidas
				if (processed == numDispositivos) {
					processed = 0;
					buffer = [];
				}
				//Flag para controlar que recibi datos de todos los dispositivos
				processed++;

				//Guardo en buffer las salidas recibidas
				salidas.forEach(function(s){ buffer.push(s) });

				var salidasAux = salidas;

				//Agrego progresivamente las salidas a la vista
				var promise = $interval(function() {
					if (i < salidasAux.length && salidasAux.length > 0) {
						$scope.salidas.push( salidasAux[i] );
						i++;
					}
					//Si recibi los datos de todos los dispositivos
					//Controlo que la cantidad de salidas activas
					//sea igual a las de la vista
					if (processed == numDispositivos) {
						$interval.cancel( promise );
						//Si la cantidad es distinta, actualizo
						if (buffer.length != $scope.salidas.length ) {
							$scope.salidas = buffer;
						}
						$scope.salidas = orderByFilter($scope.salidas, '+note');
					}
				}, 100);
			}
		});

		//Accion sobre una salida (Luz, Bomba)
		$scope.accionarSalida = function(data)
		{
			//Setea temporizacion
			data.temporizada = $('.clockpicker').val();

			//Setea el inversa del estado actual de la salida
			data.estado = (data.estado == Estados.ON)
						? Estados.OFF
						: Estados.ON;

			//Envia orden al socketArduino
			Salida.accionar( data, function(_estado)
			{
				data.estado = _estado;
			});
		}

		//Accion sobre persiana
		$scope.move = function(s, estado)
		{
			s.estado = estado;
			//Muestra estado de boton indicando la accion
			//de subir o bajar la persiana
			var boton = $('#'.concat(s.nro_salida,estado));
			$('.active').removeClass('active');
			boton.addClass('active');

			//Espera 3 segundos y resetea el estado del boton
			setTimeout(function()
			{
				boton.removeClass('active');
			}, 3000);

			//Envia orden al socketArduino
			Salida.accionar(s);
		}

		// Se dispara al hacer click en el titulo superior
		$scope.refresh = function()
		{
			SocketIO.send('getSalidas', {ip: dispositivo.ip, page: params.page});
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
			Salida.save( $scope.salida, function(response)
			{
				Popup.close();
			});
		}

		//Escucha evento broadcast para actualizar estado de salidas
		SocketIO.listen('switchBroadcast', function( params ) {
		
			//Si la salida existe, cambia el estado
			if ( Salida.findSalida( $scope.salidas, params.nro_salida).length > 0 ) {
				$scope.salidas.forEach(function(s, k, _this)
				{
					if (s.nro_salida == params.nro_salida
					&&  s.ip 		 == params.ip)
					{
						_this[k].estado 	 = params.estado;
						_this[k].temporizada = params.temporizada;
						$scope.$digest();
					}
				});
			}
			//sino, se agrega
			else {
				$scope.salidas.push(params);
				$scope.$digest();
			}
		});
	}
])
