var gulp = require('gulp'),
	concat = require('gulp-concat'),
	minify = require('gulp-minify');

gulp.task('default', function() {

		//Paths archivos
		var main = "../client/";
		var bower = main + "bower_components/";
			js	  = main + "js/modules/";

		//Concat archivos JS
		gulp.src([
			bower + 'jquery/dist/jquery.min.js',
			bower + 'angular/angular.min.js',
			bower + 'angular-ui-router/release/angular-ui-router.min.js',
			js + '/**/*.js',
			bower +'clockpicker/dist/bootstrap-clockpicker.min.js',
			bower +'fastclick/lib/fastclick.js',
			bower +'socket.io-client/socket.io.js',
			bower +'ng-dialog/js/ngDialog.min.js'
		])
		.pipe(concat('../jsmin.js'))
		.pipe(gulp.dest(main + 'js/jsmin.js'));

		//Concat archivos CSS
		gulp.src([
			bower + 'ng-dialog/css/ngDialog.min.css',
			bower + 'ng-dialog/css/ngDialog-theme-default.min.css',
			bower + 'ng-dialog/css/ngDialog-theme-plain.min.css',
			bower + 'clockpicker/dist/bootstrap-clockpicker.min.css',
			main  + 'css/main.css'
		])
		.pipe(concat('../cssmin.css'))
		.pipe(gulp.dest(main + 'css/cssmin.css'));
});