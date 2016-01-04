var socketIOModule = angular.module('Socket',[]);
socketIOModule.factory('SocketIO', ['$rootScope', function ($rootScope )
{
	if (!$rootScope.socket)
	{
		$rootScope.socket = io(window.location.origin);
	}

	return {
		send: function(param)
		{
			$rootScope.socket.emit(param);
		},
		listen: function(param, callback)
		{
			$rootScope.socket.on(param, function(data)
			{
				callback(data);
			})
		}
	}
}]);