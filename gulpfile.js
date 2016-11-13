var gulp  = require('gulp')
var shell = require('gulp-shell')
var watch = require('gulp-watch');
var path = require("path")

gulp.task('stream', function () {
    // Endless stream mode
    return watch('./*.es6', { ignoreInitial: false })
      .pipe(shell([
        "echo <%= file.path %> changed!",
        "babel <%= file.path %> -o <%= b(file.path) %>.js"
      ], {
        templateData: {
          b: function(s) {
            return path.basename(s, path.extname(s))
          }
        }
      }));
});
