//Adapter Angular ImgNotes Jquery Plugin
angular.module('ImgNotes',[])
.factory('ImgNotesFct', ['$http','ngDialog', function($http, Popup)
{
	return {
		init: function($scope)
		{
			var This = this;
			this.tag = $scope.tag;
			$scope.btEditText = 'Editar';
			$scope.toggleEdit = function()
			{
				var $this = $(this);
				$scope.btEditText = ($scope.btEditText == 'Ver') ? 'Editar' : 'Ver';
				$scope.canEdit = ($scope.btEditText == 'Ver');
				this.tag.imgNotes("option", "canEdit", $scope.canEdit);
			}
			$scope.zoom = function(p)
			{
				zoomActual = this.tag.imgNotes("option","zoom");
				if (p === 1)
				{
					zoomActual+= 0.3;
				}
				else {
					zoomActual-= 0.3;
				}
				this.tag.imgNotes("option","zoom", zoomActual);
			}
		},
		addMarker: function(data)
		{
			var models = this.getMarkers();
			models.push({
				id_disp: data.id_disp, 
				x: data.x, 
				y: data.y, 
				nro: data.nro_salida, 
				note:data.note
			});	
			this.tag.imgNotes("clear");
			this.setMarkers(models);
		},
		setMarkers: function(data)
		{
			this.tag.imgNotes("import", data || []);
		},
		getMarkers: function()
		{
			return this.tag.imgNotes('export');
		},
		deleteMarker: function()
		{
			$(document).trigger('RemoveImgNotesMarker');
		},
		refreshMarker: function(note)
		{
			$(document).trigger('UpdateImgNotesMarker',[note]);
		}
	}
}]);