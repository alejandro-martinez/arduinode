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
				console.log(salidas);
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
.controller('SalidaCtrl', ['$stateParams','SwitchButton','SalidaConfig','$rootScope',
			'ngDialog','DispositivoFct','$scope','ImgNotesFct','SalidaFct',
	function (params,SwitchButton,config,$rootScope, Popup,Dispositivo,
			  $scope,ImgNotes, Salida)
	{
		var params = params.params;
		$scope.models = {};
		$rootScope.currentMenu = params.descripcion;
		$scope.getSwitchButton = SwitchButton.getTemplate;
		$scope.showDispositivos = $scope.showSalidas = true;
		$('#image').attr('src',"/image/" + params.plano + ".jpg");

		Salida.getByPlanta(params.id_planta,function(models)
		{
			$scope.models = models;
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
			$scope.showDescripcion = $scope.showSalidas = false;
			Popup.open(
			{
				template: config.rootFolder+'_form.html',
				scope: $scope
			});
		});

		$(document).off('ImgNotesShow').on('ImgNotesShow', function(e, note)
		{

			if (note.tipo == 'P')
			{
				Popup.open(
					{
						template: config.rootFolder+'_viewPersiana.html',
						data: note,
						scope: $scope
					});
			}
			else if (note.estado != "error")
			{
				Salida.switchSalida(note, function(_estado)
				{
					var state = (_estado == 0) ? 'on' : 'off';
					$scope.models.filter(function(s)
					{
						if (s.nro_salida == note.nro_salida)
						{
							return s.estado = state;
						}
					});

					note.estado = state;
					ImgNotes.refreshMarker(note);
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
				$scope.showDescripcion = false;
				$scope.showSalidas = true;
				$scope.salida = note;
				Popup.open(
				{
					template: config.rootFolder + '_form.html',
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
			$scope.salida.id_planta = parseInt( params.id_planta );
			$scope.salida.nro_salida = select.nro_salida;
			Salida.save($scope.salida, function(r)
			{
				Popup.close();
				$scope.toggleEdit();
				r.model.estado = select.estado;
				r.model.ip =  select.ip;
				r.model.tipo =  select.tipo;
				ImgNotes.addMarker(r.model);

				//ImgNotes.refreshMarker($scope.salida.note);
				//Actualiza combo de salidas
				//para quitar las que ya fueron agregadas
				//$scope.salidas = Salida.getSalidasDisponibles($scope.salidas, ImgNotes.getMarkers());
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
.controller('EstadosCtrl', ['SalidaConfig','DispositivoFct','SwitchButton','$rootScope','$stateParams','ngDialog','$scope', 'SalidaFct',
	function (config,Dispositivo,SwitchButton,$rootScope,params, Popup, $scope, Salida)
	{
		var params = params.params;
		$rootScope.loading = true;
		$scope.ipDispositivo = params.ip;

		$rootScope.currentMenu = 'Salidas del dispositivo: ' + params.ip;

		$scope.getSwitchButton = SwitchButton.getTemplate;

		$scope.showDescripcion = $scope.editing = true;
		$scope.showDispositivos = $scope.showSalidas = false;

		$scope.salida = {};

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
			//var ip = $scope.ipDispositivo || data.ip;
			Salida.switchSalida( data, function(_estado)
			{
				$scope.salidas.filter(function(s)
				{
					if (s.nro_salida == data.nro_salida)
						 return s.estado = (_estado == 0) ? 'on' : 'off';
				});
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

		if (params.estado == 'on')
		{
			$rootScope.currentMenu = "Luces encendidas";
			Salida.getSalidasActivas(function(salidas)
			{
				$rootScope.loading = false;
				$scope.salidas = salidas;
				$scope.$apply();
			});
		}
		else
		{
			Salida.getSalidasArduino(
			{
				ip		: $scope.ipDispositivo,
				id_disp : params.id_disp
			},
			function(salidas)
			{
				console.log(salidas);
				$rootScope.loading = false;
				$scope.salidas = salidas;
				$scope.$apply();
			});
		}
	}
])
