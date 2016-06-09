const gulp = require('gulp');
const tagger = require('../../..');

gulp.task('default', () => {
	gulp.src('actual.js')
		.pipe(tagger())
		.pipe(gulp.dest('build'));
});
