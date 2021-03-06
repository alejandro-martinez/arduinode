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
.config(function ($httpProvider,$compileProvider) {
    $httpProvider.interceptors.push('httpInterceptor');
	$compileProvider.debugInfoEnabled(false);
})
.run(['$rootScope','DispositivoFct',function($rootScope, Dispositivo)
{
    localStorage.clear();
	Dispositivo.getAll(function(){});
}]);