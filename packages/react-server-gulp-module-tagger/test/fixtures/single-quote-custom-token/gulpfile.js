const gulp = require('gulp');
const tagger = require('../../..');

gulp.task('default', () => {
	gulp.src('actual.js')
		.pipe(tagger({
			token: "__JOEVIN_JONES__",
		}))
		.pipe(gulp.dest('build'));
});
