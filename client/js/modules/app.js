//Inicio
//Dependencias
//Factories y Services comunes a la aplicacion
angular.module('Arduinode',
[
	'ngRoute',
	'ngDialog',
	'ngTouch',
	'Arduinode.Salida',
	'Arduinode.Dispositivo'
])
.controller('MainCtrl', ['$scope', function ($scope )
{
	$scope.currentMenu = 'Home';
	$scope.linksMenu = [
		{link: "salida/a",		texto: "Plano 1"},
		{link: "salida/b", 	texto: "Plano 2"},
		{link: "dispositivo", 	texto: "Dispositivos"}
	];
	$scope.showmenu = false;

	$scope.toggleMenu = function()
	{
		$scope.showmenu = ($scope.showmenu) ? false : true;
	}
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