const gulp = require('gulp');
const tagger = require('react-server-gulp-module-tagger');
const babel = require('gulp-babel');

gulp.task('default', () => {
	gulp.src('*.js')
			.pipe(tagger())
			.pipe(babel({
				presets: ['react-server']
			}))
			.pipe(gulp.dest('build'));
});
