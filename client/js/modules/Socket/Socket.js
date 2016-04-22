var socketIOModule = angular.module('Socket',[]);

socketIOModule.factory('SocketIO', ['$rootScope','ngDialog', function ($rootScope, Popup )
{
	if (!$rootScope.socket)
	{
		// Lanza el socket en la ip origen actual
		$rootScope.socket = io(window.location.origin);

		// Escucha errores del servidor
		$rootScope.socket.on('Error', function(error)
		{
			if ( Object.getOwnPropertyNames(error).length == 0 )
			{
				var error = 'Error Desconocido';
			}
			else
			{
				$rootScope.error = error;
			}
			$rootScope.loading = false;
			Popup.open({ template: '<h1>' + error + '</h1>', plain: true });
		});

		$rootScope.socket.on('horaServidor', function(hora) {
			$rootScope.horaServidor = hora;
		})
	}

	// Métodos disponibles del Socket
	return {

		// Envia un parametro
		send: function(param, _data)
		{
			$rootScope.socket.emit(param, _data || {});
		},

		// Escucha un evento
		listen: function(param, callback)
		{
			$rootScope.socket.removeListener(param);
			$rootScope.socket.on(param, function(data)
			{
				callback(data);
			});
		}
	}
}]);
