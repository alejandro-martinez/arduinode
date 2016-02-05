//Inicio
//Dependencias
//Factories y Services comunes a la aplicacion
angular.module('Arduinode',
[	'ui.router',
	'ngDialog',
	'ngTouch',
	'Arduinode.Salida',
	'Arduinode.Planta',
	'Arduinode.Home',
	'Arduinode.Dispositivo',
	'Arduinode.Tarea'
])
.controller('MainCtrl', ['$state','$rootScope', function ($state, $rootScope )
{
	$rootScope.currentMenu = 'Home';
	$rootScope.previousState;
	$rootScope.currentState;
	$rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
		$rootScope.previousState = from.name;
		$rootScope.currentState = to.name;
		console.log(from.name, to.name);
	});
	$rootScope.goBack = function()
	{
		$state.go($rootScope.previousState);
	}

	//Config Lib Fastclick para eliminar delay botones en mobile
	$(function() {
		FastClick.attach(document.body);
	});
}])
.factory('httpInterceptor', function ($q, $rootScope, $log) {

    return {
        request: function (config) {
            $rootScope.loading = true;
            return config || $q.when(config)
        },
        response: function (response) {
            $rootScope.loading = false;
            return response || $q.when(response);
        },
        responseError: function (response) {
            $rootScope.loading = false;
            return $q.reject(response);
        }
    };
})
.config(function ($httpProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
});