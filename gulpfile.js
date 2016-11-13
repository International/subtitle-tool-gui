var gulp  = require('gulp')
var shell = require('gulp-shell')
var watch = require('gulp-watch');
var path = require("path")

gulp.task('stream', function () {
    // Endless stream mode
    return watch('./*.es6', { ignoreInitial: false })
        .pipe(shell([
          "echo <%= file.path %>",
          "babel <%= file.path %> -o <%= b(file.path) %>.js"
        ], {
          templateData: {
            b: function(s) {
              return path.basename(s, path.extname(s))
            }
          }
        }));
});
//
// gulp.task('example', function () {
//   return gulp.src('*.js', {read: false})
//     .pipe(shell([
//       'echo <%= f(file.path) %>',
//       'ls -l <%= file.path %>'
//     ], {
//       templateData: {
//         f: function (s) {
//           return s.replace(/$/, '.bak')
//         }
//       }
//     }))
// })
