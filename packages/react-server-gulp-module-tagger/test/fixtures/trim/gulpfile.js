const gulp = require('gulp');
const tagger = require('react-server-gulp-module-tagger');

gulp.task('default', () => {
	gulp.src('*.js')
			.pipe(tagger({ trim: 'act' }))
			.pipe(gulp.dest('build'));
});
