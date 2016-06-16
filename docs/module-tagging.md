# Module tagging

To enable our [logging](/logging), we have to do a source transform to provide
the file name, and an isomorphic color object, to all of our logging instances.
This keeps coloring consistent for logging across the server and the client,
and makes for a much better developer experience by identifying the file from
which log lines and monitoring originated from on the server and the client
before transpilation and code splitting.

The easiest way to get started with module tagging is with
[react-server-cli](http://npmjs.com/packages/react-server-cli).  If you're
already babelifying your code, you can use
[babel-plugin-react-server](http://npmjs.com/packages/babel-plugin-react-server)
, which is included in
[babel-preset-react-server](http://npmjs.com/packages/babel-preset-react-server)
to tag your react server modules.  If you're already using gulp to build your
react server modules, you can use
[react-server-gulp-module-tagger](http://npmjs.com/packages/react-server-gulp-module-tagger)
.  If you write custom build scripts, you can use the method that all of the
module taggers use to generate the module tags as well with
[react-server-module-tagger](http://npmjs.com/packages/react-server-module-tagger)
.  Because internally all of the module taggers call the same module, it doesn't
matter which method you choose to tag your react server modules; the result is
exactly the same.  We provide many methods for tagging your modules to make
react server easy to use (though it also makes testing and development quicker
and easier).
