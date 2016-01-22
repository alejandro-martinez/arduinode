angular.module('Arduinode.Planta',[])
.config(function( $stateProvider, $urlRouterProvider )
{

	$stateProvider
		.state('plantas',
		{
			//url: "/plantas/",
			templateUrl: "js/modules/Planta/index.html",
			controller: 'PlantaCtrl'
		})
		.state('nuevaPlanta',
		{
			templateUrl: "js/modules/Planta/_form.html",
			controller: 'FormCtrl'
		})
})
.factory('PlantaFct', ['$http','SocketIO','ngDialog', function($http, Socket, Popup)
{
	var Planta =
	{
		getAll: function(callback)
		{
			$http.get('/planta').then(function(response)
			{
				callback(response.data)
			}, function(err)
			{
				callback(error)
			});
		},
		remove: function(id)
		{
			$http.get('/planta/delete/'+id).then(function(response)
			{
				if (response.data && response.data.res === 1)
				{
					Popup.open({
						template:'<h1>Se eliminó la planta</h1>',
						plain:true
					});
					$state.go('plantas');
				}
			}, function(error)
			{
				if (response.data)
				{
					Popup.open({
						template:'<h1>'+response.data+'</h1>',
						plain:true
					});
				}
			});
		},
		save: function( planta )
		{
			$http.post('/planta/save/',planta).then(function(response)
			{
				if (response.data && response.data.error)
				{
					Popup.open({
						template:'<h1>' + response.data.error	+ '</h1>',
						plain:true
					});
				}
				else
				{
					$state.go('plantas');
				}
			}, function(error)
			{
				Popup.open({
					template:'<h1>' + error	+ '</h1>',
					plain:true
				});
			});
		}
	}
	return Planta;
}])
.controller('PlantaCtrl', ['$scope','PlantaFct',function ($scope, Planta)
{
	$scope.plantas = [];
	Planta.getAll(function(plantas)
	{
		console.log(plantas);
		$scope.plantas = plantas;
	})
	$scope.delete = function()
	{
		Planta.delete();
	}
}])
.controller('FormCtrl', ['$stateParams','$scope','PlantaFct','ngFileUpload',
	function (params, $scope, PlantaFct, Upload)
	{
		var params = params.params;
		$scope.model = {};

		if (params && params.id_planta)
		{
			Planta.get(params.id_planta, function(model)
			{
				$scope.model = model;
			});
		}

		$scope.upload = function (file) {
			Upload.upload({
				url: 'upload/url',
				data: {file: file, 'username': $scope.username}
			}).then(function (resp) {
				console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
			}, function (resp) {
				console.log('Error status: ' + resp.status);
			}, function (evt) {
				var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
				console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
			});
		};
		$scope.save = function(model)
		{
			if ($scope.plantaForm.file.$valid && $scope.file) {
				$scope.upload($scope.file);
			}
			if (!$scope.plantaForm.$invalid)
				Planta.save(model);
		};
	}
])

