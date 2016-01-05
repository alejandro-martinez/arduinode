angular.module('Arduinode.Salida',['Socket','ImgNotes'])
.config(['$routeProvider', function ($routeProvider)
{
	$routeProvider
		.when('/salida/estados/:id_disp', {
			templateUrl: 'js/modules/Salida/_estados.html',
			controller: 'EstadosCtrl'
		})
		.when('/salida/:route', {
			templateUrl: 'js/modules/Salida/_salidas.html',
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
		toggle: function(nro_salida, callback)
		{
			Socket.send('toggleSalida',nro_salida);
		},
		getSalidasArduino: function(callback)
		{
			Socket.send('getSalidas');
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
.controller('SalidaCtrl', ['$routeParams','ngDialog','DispositivoFct',
			'$scope','ImgNotesFct','SalidaFct',
	function ($routeParams, Popup,Dispositivo, $scope,ImgNotes, Salida)
	{
		$scope.models = {};
		$scope.loaded = false;
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
				template: 'js/modules/Salida/_form.html',
				scope: $scope
			});
		});

		$(document).off('ImgNotesShow').on('ImgNotesShow', function(e, note)
		{
			Popup.open(
			{
				template: 'js/modules/Salida/_view.html',
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
					template: 'js/modules/Salida/_form.html',
					scope: $scope
				});
			}
		});
		$scope.export = function()
		{
			$scope.models = ImgNotes.getMarkers();
			Salida.save( $scope.models );
		}
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
.controller('EstadosCtrl', ['$routeParams','ngDialog','$scope', 'SalidaFct',
	function ($routeParams, Popup, $scope, Salida)
	{
		/*	s = io(window.location.origin);
			s.emit({'param': 'G'});
			s.on('data', function(data){
				console.log('Estado:' + data);
			});
		*/
		$scope.getTemplate = function()
		{
			return 'js/modules/Salida/_switchButton.html';
		}
		$scope.toggle = function(nro_salida, estado)
		{
			Salida.toggle(nro_salida);
		}
		Salida.getSalidasArduino(function(salidas)
		{
			$scope.salidas = salidas;
			$scope.$apply();
		});

	}
])
