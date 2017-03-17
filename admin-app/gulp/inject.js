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
/*
  var injectCustomCSS = gulp.src([
    './bower_components/font-awesome/css/font-awesome.min.css',
    './bower_components/slick-carousel/slick/slick.css',
    './bower_components/slick-carousel/slick/slick-theme.css',
    './bower_components/angular-color-picker/dist/angularjs-color-picker.min.css',
    './bower_components/angular-color-picker/dist/themes/angularjs-color-picker-bootstrap.min.css',
  ]);
  */
  var injectOptions = {
    ignorePath: [paths.src, paths.tmp + '/serve'],
    addRootSlash: false
  };

  var wiredepOptions = {
    directory: 'bower_components',
/*
    src: ['bower_components/font-awesome/css/font-awesome.min.css','/bower_components/slick-carousel/slick/slick.css','/bower_components/slick-carousel/slick/slick-theme.css','/bower_components/slick-carousel/slick/slick-theme.css','/bower_components/angular-color-picker/dist/themes/angularjs-color-picker-bootstrap.min.css'],
    exclude: [ /bootstrap\.css/, /foundation\.css/],
*/
    overrides:{
        "slick-carousel":{
          "main":[
             "slick/slick.js",
             "slick/slick.css",
             "slick/slick.less",
             "slick/slick.scss",
             "slick/slick-theme.css"
          ]
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
    //.pipe($.inject(injectCustomCSS , injectOptions))
    .pipe(wiredep(wiredepOptions))
    .pipe(gulp.dest(paths.tmp + '/serve'));

});
