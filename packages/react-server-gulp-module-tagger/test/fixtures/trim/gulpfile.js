const gulp = require('gulp');
const tagger = require('../../..');

gulp.task('default', () => {
	gulp.src('actual.js')
		.pipe(tagger({ trim: 'react-server-gulp-module-tagger.test.' }))
		.pipe(gulp.dest('build'));
});
