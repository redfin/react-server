const gulp = require('gulp');
const tagger = require('../../..');

gulp.task('default', () => {
	gulp.src('actual.js')
		.pipe(tagger({ prefix: 'christian-roldan.' }))
		.pipe(gulp.dest('build'));
});
