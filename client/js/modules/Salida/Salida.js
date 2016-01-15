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
		.when('/salida/:estadoLuces', {
			templateUrl: config.rootFolder+'_estados.html',
			controller: 'EstadosCtrl'
		})
		.when('/salida/:id_planta/:plano', {
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
		toggleLuces: function(ip, nro_salida, callback)
		{
			Socket.send('toggleSalida',{ip: ip, salida: nro_salida});

			Socket.listen('toggleResponse', function(estado)
			{
				callback(estado);
				Socket.listen('toggleResponse',function(){});
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
		//Consulta los estados de las salidas de los dispositivos
		getEstados: function( salidas, callback )
		{
			Socket.send('getEstados',salidas);
			Socket.listen('estados', function(estados)
			{
				callback(estados);
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
.controller('SalidaCtrl', ['SwitchButton','SalidaConfig','$rootScope','$routeParams',
			'ngDialog','DispositivoFct','$scope','ImgNotesFct','SalidaFct',
	function (SwitchButton,config,$rootScope,$routeParams, Popup,Dispositivo,
			  $scope,ImgNotes, Salida)
	{
		$rootScope.currentMenu = 'Planta ' + $routeParams.plano;
		$scope.models = {};
		$scope.getSwitchButton = SwitchButton.getTemplate;

		$('#image').attr('src',"/image/" + $routeParams.plano + ".jpg");

		Salida.getAll($routeParams.id_planta,function(models)
		{
			$scope.models = models.data;
			$scope.tag = $('#image').imgNotes();
			ImgNotes.init( $scope );
			ImgNotes.setMarkers( $scope.models );
			Salida.getEstados($scope.models, function(models)
			{
				ImgNotes.clearMarkers();
				$scope.models = models;
				ImgNotes.setMarkers( $scope.models );
			});
			console.log("markers inicio",ImgNotes.getMarkers());
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
			console.log(note);
			if (note.tipo == 'P')
			{
				Popup.open(
					{
						template: config.rootFolder+'_viewPersiana.html',
						data: note,
						scope: $scope
					});
			}
			else
			{
				Salida.toggleLuces(note.ip, note.nro, function(_estado)
				{
					var state = (_estado == 1) ? 'on' : 'off';
					$scope.models.filter(function(s)
					{
						if (s.nro_salida == note.nro)
							return s.estado = state;
					});
					note.estado = state;
					ImgNotes.clearMarkers();
					ImgNotes.setMarkers( $scope.models);
					Popup.open(
					{
						template: config.rootFolder+'_view.html',
						data: note
					});
				});
			}
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
			Salida.deleteSalida(id, function(r)
			{
				Popup.close();
				if (r.res === 1)
				{
					ImgNotes.deleteMarker();
				}
			})
		}
		$scope.save = function(salida, select)
		{
			$scope.salida.id_disp = $scope.disp.id_disp;
			$scope.salida.id_planta = parseInt( $routeParams.id_planta );
			$scope.salida.tipo = select.tipo;
			$scope.salida.nro_salida = select.nro_salida;
			Salida.save($scope.salida, function(r)
			{
				Popup.close();
				$scope.toggleEdit();
				if (r.res == 'created')
				{
					ImgNotes.addMarker(r.model);
				}
				ImgNotes.refreshMarker($scope.salida.note);
				//Actualiza combo de salidas
				//para quitar las que ya fueron agregadas
				$scope.salidas = Salida.getSalidasDisponibles($scope.salidas, ImgNotes.getMarkers());
			});
		};
		$scope.disp = {};
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
.controller('EstadosCtrl', ['SalidaConfig','SwitchButton','$rootScope','$routeParams','ngDialog','$scope', 'SalidaFct',
	function (config,SwitchButton,$rootScope,$routeParams, Popup, $scope, Salida)
	{
		$rootScope.loading = true;
		$scope.ipDispositivo = $routeParams.ip;
		$rootScope.currentMenu = 'Salidas del dispositivo: ' + $scope.ipDispositivo;
		$scope.getSwitchButton = SwitchButton.getTemplate;

		//Funcionamiento Luces
		$scope.toggle = function(nro_salida, estado)
		{
			Salida.toggleLuces($scope.ipDispositivo,nro_salida, function(_estado)
			{
				$scope.salidas.filter(function(s)
				{
					if (s.nro_salida == nro_salida)
						 return s.estado = (_estado == 1) ? 'on' : 'off';
				});
			});
		}
		//Funcionamiento Persianas
		$scope.move = function(nro_salida, action)
		{
			var params = {
				ip: $scope.ipDispositivo,
				action: action,
				nro_salida: nro_salida
			}
			Salida.movePersiana(params, function(_response)
			{
				var boton = $('#' + nro_salida+action);
				$('.active').removeClass('active');
				boton.addClass('active');
				setTimeout(function()
				{
 					boton.removeClass('active');
				}, 3000);

			});
		}
		Salida.getSalidasArduino(
		{
			ip		: $scope.ipDispositivo,
			id_disp : $routeParams.id_disp,
			estado: $routeParams.estadoLuces || null
		},
		function(salidas)
		{
			$rootScope.loading = false;
			$scope.salidas = salidas;
			$scope.$apply();
		});

	}
])
