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
.controller('MainCtrl', ['$rootScope', function ($scope )
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
}]);