//Inicio
//Dependencias
//Factories y Services comunes a la aplicacion
angular.module('Arduinode',
[
	'ngRoute',
	'ngDialog',
	'ngTouch',
	'Arduinode.Salida',
	'Arduinode.Home',
	'Arduinode.Dispositivo'
])
.controller('MainCtrl', ['$scope', function ($scope )
{
	$scope.currentMenu = 'Home';
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