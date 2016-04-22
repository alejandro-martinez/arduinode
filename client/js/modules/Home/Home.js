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
.controller('MainCtrl', [ '$state', '$rootScope',
	function ( $state, $rootScope ) {

	$rootScope.currentMenu = 'Home';
	$rootScope.previousState;
	$rootScope.currentState;

	//Setea las rutas anterior y actual, al navegar
	$rootScope.$on('$stateChangeSuccess',function(ev, to, toParams, from, fromParams)
	{
		$rootScope.previousState = from.name;
		$rootScope.currentState = to.name;
	});

	//Control de navegación hacia atrás
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

	//Componente Fastclick para eliminar delay de botones en smarphones
	$(function()
	{
		FastClick.attach(document.body);
	});

}])