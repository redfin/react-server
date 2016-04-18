var gulp = require('gulp');
var chug = require('gulp-chug');
var install = require('gulp-install');

gulp.task('travis-ci', ['test', 'integration-test', 'eslint']);

// Pass-through tasks.
[
	'test',
	'eslint',
].map(task => {
	gulp.task(task, () => gulp
		.src(['./packages/*/gulpfile.js', './packages/*/gulpfile.babel.js'], {read: false})
		.pipe(chug({ tasks: [task] }))
	)
});

// all of the subdirectories in packages get installed by lerna, but for
// various reasons, the integration tests are not under packages, so we need
// to call npm install in that dir as part of the build.
gulp.task('install-integration-test', () => gulp.src(['./integration-tests/package.json'])
  .pipe(install())
);

// run the integration tests.
gulp.task('integration-test', ['install-integration-test'], () => gulp
	.src(['./integration-tests/gulpfile.babel.js'], {read: false})
	.pipe(chug({tasks: ['test']}))
);
