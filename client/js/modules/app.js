//Inicio
//Dependencias
//Factories y Services comunes a la aplicacion
angular.module('Arduinode',
[	'ui.router',
	'ngDialog',
	'Arduinode.Salida',
	'Arduinode.Home',
	'Arduinode.Dispositivo',
	'Arduinode.Tarea'
])
.controller('MainCtrl', ['$state','$rootScope',
			function ($state, $rootScope )
{
	$rootScope.currentMenu = 'Home';
	$rootScope.previousState;
	$rootScope.currentState;
	$rootScope.$on('$stateChangeSuccess',
	function(ev, to, toParams, from, fromParams)
	{
		$rootScope.previousState = from.name;
		$rootScope.currentState = to.name;
	});
	$rootScope.goBack = function()
	{
		if ($rootScope.previousState == 'estados'
			|| $rootScope.currentState == 'tareas'
		)
		{
			$state.go('home');
		}
		else
		{
			$state.go($rootScope.previousState);
		}
	}

	//Config Lib Fastclick para eliminar delay botones en mobile
	$(function()
	{
		FastClick.attach(document.body);
	});

}])
.factory('httpInterceptor', function ($q, $rootScope, $log) {

	var updateTime = function(time)
	{
		if (time) {
			//Actualizo la vista con la hora del servidor
			var date = new Date(time);
			$rootScope.horaServidor = date.getTime();
		}
	};

    return {
        request: function (config) {
            $rootScope.loading = true;
            return config || $q.when(config)
        },
        response: function (response) {
			updateTime(response.headers().date);
            $rootScope.loading = false;
            return response || $q.when(response);
        },
        responseError: function (response) {
            $rootScope.loading = false;
            return $q.reject(response);
        }
    };
})
.config(function ($httpProvider,$compileProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
	$compileProvider.debugInfoEnabled(false);
})
.run(['$rootScope','DispositivoFct',function($rootScope, Dispositivo)
{
    localStorage.clear();
	Dispositivo.getAll(function(){});
}]);