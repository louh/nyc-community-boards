'use strict'

var gulp = require('gulp')
var gutil = require('gulp-util')
var browserSync = require('browser-sync')

var paths = {
  styles: 'src/css/**/*.scss',
  scripts: 'src/js/**/*.js',
  app: 'public/index.html'
}

gulp.task('default', ['serve'])

gulp.task('build', ['css', 'js'])

gulp.task('css', function () {
  var sass = require('gulp-sass')
  var autoprefix = require('gulp-autoprefixer')
  var cssimport = require('gulp-cssimport')
  var cssnano = require('gulp-cssnano')
  var rename = require('gulp-rename')

  gulp.src('src/css/styles.scss')
    .pipe(sass())
    .pipe(autoprefix('last 2 versions'))
    .pipe(cssimport())
    .pipe(cssnano({ zindex: false }))
    .pipe(rename('styles.css'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream())
})

gulp.task('js', function () {
  var browserify = require('browserify')
  var envify = require('loose-envify')
  var source = require('vinyl-source-stream')
  var buffer = require('vinyl-buffer')
  var uglify = require('gulp-uglify')
  var sourcemaps = require('gulp-sourcemaps')

  // Set NODE_ENV for Redux and loose-envify
  process.env.NODE_ENV = 'production'

  // see package.json for transforms
  return browserify({ entries: ['src/js/main.js'] })
    .transform('babelify', { presets: ['es2015', 'react'] })
    .bundle()
    .pipe(source('main.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
      // Add transformation tasks to the pipeline here.
      .pipe(uglify())
      .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
})

// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('js-watch', ['js'], browserSync.reload)

gulp.task('serve', ['build'], function () {
  browserSync.init({
    browser: 'google chrome',
    server: {
      baseDir: './public',
    }
  })

  gulp.watch(paths.styles, ['css'])
  gulp.watch(paths.scripts, ['js-watch'])
  gulp.watch(paths.app).on('change', browserSync.reload)
})
