var gulp = require('gulp');
var chug = require('gulp-chug');

gulp.task('travis-ci', ['test', 'eslint']);

// Pass-through tasks.
[
	'test',
	'eslint',
].map(task => {
	gulp.task(task, () => gulp
		.src('./packages/*/gulpfile.js', {read: false})
		.pipe(chug({ tasks: [task] }))
	)
});
