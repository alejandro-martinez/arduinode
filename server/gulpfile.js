var gulp = require('gulp'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	minify = require('gulp-minify');

gulp.task('default', function() {

		//Concat scripts JS
		gulp.src(["../client/bower_components/jquery/dist/jquery.min.js",
		"../client/bower_components/angular/angular.min.js",
		"../client/bower_components/angular-ui-router/release/angular-ui-router.min.js",
		"../client/js/modules/app.js",
		"../client/js/modules/Socket/Socket.js",
		"../client/js/modules/Salida/Salida.js",
		"../client/js/modules/Home/Home.js",
		"../client/js/modules/Dispositivo/Dispositivo.js",
		"../client/js/modules/Tarea/Tarea.js",
		"../client/bower_components/clockpicker/dist/bootstrap-clockpicker.min.js",
		"../client/bower_components/fastclick/lib/fastclick.js",
		"../client/bower_components/socket.io-client/socket.io.js",
		"../client/bower_components/ng-dialog/js/ngDialog.min.js"])
		.pipe(concat('../jsmin.js'))
		.pipe(gulp.dest('../client/js/jsmin.js'));

		//Concat archivos CSS
		gulp.src(["../client/bower_components/ng-dialog/css/ngDialog.min.css",
		"../client/bower_components/ng-dialog/css/ngDialog-theme-default.min.css",
		"../client/bower_components/ng-dialog/css/ngDialog-theme-plain.min.css",
		"../client/bower_components/clockpicker/dist/bootstrap-clockpicker.min.css",
		"../client/css/main.css"])
		.pipe(concat('../cssmin.css'))
		.pipe(gulp.dest('../client/css/cssmin.css'));

});