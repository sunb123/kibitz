'use strict';

var gulp = require('gulp');

var paths = gulp.paths;

var $ = require('gulp-load-plugins')();

var wiredep = require('wiredep').stream;

gulp.task('inject', ['styles'], function () {

  var injectStyles = gulp.src([
    paths.tmp + '/serve/{app,components}/**/*.css',
    '!' + paths.tmp + '/serve/app/vendor.css'
  ], { read: false });

  var injectScripts = gulp.src([
    paths.src + '/{app,components}/**/*.js',
    '!' + paths.src + '/{app,components}/**/*.spec.js',
    '!' + paths.src + '/{app,components}/**/*.mock.js'
  ]).pipe($.angularFilesort());

  var injectOptions = {
    ignorePath: [paths.src, paths.tmp + '/serve'],
    addRootSlash: false
  };

  var wiredepOptions = {
    directory: 'bower_components',
    //exclude: [/bootstrap\.css/, /foundation\.css/]
    overrides:{
	"bootstrap": {
	  "main": [
	    "dist/css/bootstrap.css",
	    "dist/js/bootstrap.js",
	    "dist/fonts/glyphicons-halflings-regular.eot",
	    "dist/fonts/glyphicons-halflings-regular.svg",
	    "dist/fonts/glyphicons-halflings-regular.ttf",
	    "dist/fonts/glyphicons-halflings-regular.woff",
	    "dist/fonts/glyphicons-halflings-regular.woff2",
	    "less/bootstrap.less"
	  ],
	},

        "font-awesome":{
           "main": [
             "css/font-awesome.min.css",
             "less/font-awesome.less",
             "scss/font-awesome.scss",
             "fonts/FontAwesome.otf",
             "fonts/fontawesome-webfont.eot",
             "fonts/fontawesome-webfont.svg",
             "fonts/fontawesome-webfont.ttf",
             "fonts/fontawesome-webfont.woff",
             "fonts/fontawesome-webfont.woff2"
            ]
        }
    }

  };

  return gulp.src(paths.src + '/*.html')
    .pipe($.inject(injectStyles, injectOptions))
    .pipe($.inject(injectScripts, injectOptions))
    .pipe(wiredep(wiredepOptions))
    .pipe(gulp.dest(paths.tmp + '/serve'));

});
