const gulp = require('gulp');
const tagger = require('../../..');

gulp.task('default', () => {
	gulp.src('actual.js')
		.pipe(tagger({
			token: "__OZZIE_ALONSO__",
		}))
		.pipe(gulp.dest('build'));
});
