angular.module('Arduinode.Home',[])
.config(['$routeProvider', function ($routeProvider)
{
	$routeProvider
		.when('/',
		{
			templateUrl: 'js/modules/Home/home.html',
			controller: 'HomeCtrl'
		})
		.otherwise(
		{
			redirectTo: '/'
		});
}])