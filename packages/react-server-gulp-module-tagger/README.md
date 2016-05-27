# react-server-gulp-module-tagger

A [gulp](http://gulpjs.com) plugin for tagging [react-server](https://www.npmjs.com/package/react-server) logger instances with information about the module they're being used in.

To transpile your source for use with [React Server](https://www.npmjs.com/package/react-server), install gulp and the plugin

```shell
npm i -D gulp react-server-gulp-module-tagger
```

Then add the task to your gulpfile

```javascript
const gulp = require('gulp');
const tagger = require('react-server-gulp-module-tagger');
gulp.task('compile', () => {
    gulp.src('src')
        .pipe(tagger())
        .pipe(gulp.dest('dist'));
});
```

A compile task might also use [Babel](https://babeljs.io) with the [React Server Babel preset](https://www.npmjs.com/package/babel-preset-react-server) to transpile jsx and
es 7 for the browser and the server

```javascript
const gulp = require('gulp');
const babel = require('gulp-babel');
const tagger = require('react-server-gulp-module-tagger');

gulp.task('compile', () => {
    gulp.src('src')
        .pipe(tagger(
            trim: 'src.'
        ))
        .pipe(babel({ presets: ['react-server'] }))
        .pipe(gulp.dest('dist'));
});
```

Given a [`getLogger`](http://redfin.github.io/react-server/annotated-src/logging) call,
adds the correct arguments to keep the server and the browser in sync.

For example, given a module in `src/components/my-feature/foo.js`, and using the options
`{ trim: 'src.' }`

```javascript
let logger = require("react-server").logging.getLogger(__LOGGER__);
```

returns a logger instance that will have consistent coloring on the server and
the client, and that has a human-friendly, readable name that easily maps to
the file tree (in this example `components.my-feature.foo`).

If you need more than one logger in your module, you can distinguish them
with labels

```javascript
var fooLogger = logging.getLogger(__LOGGER__({ label: "foo" }));
var barLogger = logging.getLogger(__LOGGER__({ label: "bar" }));
```

Two other tokens, `__CHANNEL__` and `__CACHE__`, are reserved for future use,
and will also be replaced with a module context.
