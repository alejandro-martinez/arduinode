var socketIOModule = angular.module('Socket',[]);
socketIOModule.factory('SocketIO', ['$rootScope','ngDialog', function ($rootScope, Popup )
{
	if (!$rootScope.socket)
	{
		$rootScope.socket = io(window.location.origin);

		//Listen for errors
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
			Popup.open({
				template: '<h1>' + error + '</h1>',
				plain: true
			});
		});
	}

	return {
		send: function(param, _data)
		{
			$rootScope.loading = true;
			$rootScope.socket.emit(param, _data || {});
		},
		listen: function(param, callback)
		{
			$rootScope.socket.removeListener(param);

			$rootScope.socket.on(param, function(data)
			{
				$rootScope.loading = false;
				callback(data);
			});
		}
	}
}]);
