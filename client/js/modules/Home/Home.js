angular.module('Arduinode.Home',[])
.config(function( $stateProvider, $urlRouterProvider )
{

	$urlRouterProvider.otherwise("/");

	$stateProvider
		.state('home',
		{
				url: "/",
				templateUrl: "js/modules/Home/home.html",
				controller: 'MainCtrl'
		})
})
.controller('HomeCtrl', ['$scope',function ($scope )
{
}])
