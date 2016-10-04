## A simple command line tool to build and run React Server sites

To get started:

```bash
$ npm install -g react-server-cli
$ react-server init
$ react-server add-page '/' Homepage
$ react-server start
```

## What It Does

The CLI builds and runs a React Server project, using Express. It compiles
JS(X) and CSS into efficiently loadable bundles with code splitting using
webpack, and it supports hot reloading of React components on the client-side
during development.

## Built-in Features

### Babel Compilation
It's rare to see a project these days in the JavaScript world that isn't at
least experimenting with ES2015 and ES7. To make this easier, all code in your
project will be run through Babel, and source maps will be generated back to
the original file.

To take advantage of the Babel compilation, you need to install the Babel
plugins and presets you want and reference them in a `.babelrc` file in your
code directory. For more on the `.babelrc` format, see [its documentation
here](https://babeljs.io/docs/usage/babelrc/).

## Configuration

### Routes

This is where URLs are mapped to pages.  It's also where global middleware
(applied to all pages in the site) is defined.

By default this is created at the site's root directory as `routes.json`.

```json
{
	"middleware": [
		"middleware/FooMiddleware",
		"middleware/BarMiddleware"
	],
	"routes": {
		"BazPage": {
			"path": ["/"],
			"page": "pages/BazPage"
		},
		"BakPage": {
			"path": ["/bak"],
			"page": "pages/BakPage"
		}
	}
}
```

## Server config

You can define JSON options either in a `.reactserverrc` or in a
`reactServer` object in your `package.json`.

You can provide environment-specific values in a sub-object at the key `env`.

It looks like this:

```json
{
	"routes": "routes.json",
	"port": "5000",
	"env": {
		"production": {
			"port": "80"
		}
	}
}
```

The values in a particular environment override the main settings. In this
example configuration `port` will be set to 80 if `process.env.NODE_ENV` is
`production`, and 5000 otherwise.


## Options
Smart defaults are the goal, and `react-server-cli` has two base modes:
**development** and **production**. `react-server-cli` will determine which
base mode it's in by looking at the NODE_ENV environment variable. If it's not
"production", then `react-server-cli` will assume we are in development mode.

### Ways to add options

There are three ways to pass options to the CLI, through the command line,
`.reactserverrc` JSON files, or as a `reactServer` entry in `package.json`
files. If there's no config file (or package.json config) in the current
working directory, then parent directories are searched up to the root of the
filesystem.  Options passed to the CLI take final precedence.

### Webpack options

React Server will take care of the default Webpack options but if you need to set up custom loaders for example you can do it with a user callback function.

```javascript
export default (webpackConfig) => {
	// Insert a new sass and css loader before the default.
	webpackConfig.module.loaders.splice(0, {
		test: /\.s(a|c)ss$/,
		loaders: ["style", "css", "sass", "customloader"],
	})
	return webpackConfig
}
```

In the `.reactserverrc` file add an option for `webpack-config` that points to that function file and when React Server is setting up Webpack it will call your function with the result of the built in Webpack options, allowing you to make any modifications needed.




### Development mode: making a great DX

Development mode is the default, and its goals are rapid startup and code-test
loops. Hot mode is enabled for all code, although at this time, editing the
routes file or modules that export a Page class still requires a browser
reload to see changes. Modules that export a React component should reload
without a browser refresh.

In development mode, code is not minified in order to speed up startup time,
so please do not think that the sizes of bundles in development mode is
indicative of how big they will be in production. In fact, it's really best
not to do any kind of perf testing in development mode; it will just lead you
astray.

We are also considering completely getting rid of server-side rendering in
development mode by default to speed startup.

### Production mode: optimizing delivery

Production mode's priority is optimization at the expense of startup time. A
separate code bundle is generated for every entry point into your app so that
there is at most just one JS and one CSS file loaded by the framework. All
code is minified, and hot reloading is turned off.

#### Building static files for production use

In many production configurations, you may not want `react-server-cli` to
serve up your static JavaScript and CSS files. Typically, this is because you
have a more performant static file server already set up or because you upload
all your static files to a CDN server.

To use `react-server-cli` in this sort of production setup, use `react-server
compile` to generate static assets.

```bash
$ NODE_ENV=production react-server compile
$ # Upload `__clientTemp/build` to static file server
$ NODE_ENV=production react-server start
```

In this case you'll want to specify a `jsUrl` key in your production config:

```json
{
	...
	"env": {
		"production": {
			...
			"jsUrl": "http://mystaticfileserver.com/somedirectory/"
		}
	}
}
```

### Commands

#### `init`

Generate:
- `routes.json`
- `.reactserverrc`
- `.babelrc`

Install:
- `react-server`

#### `add-page <urlPath> <ClassName>`

Add a stub of a new page class.

#### `start`

Start the server.  If running with local client assets, build those.

#### `compile`

Compile the client JavaScript only, and don't start any servers. This is what
you want to do if you are building the client JavaScript to be hosted on a CDN
or separate server. Unless you have a very specific reason, it's almost always
a good idea to only do this in production mode.

### Options

The following options are available.  Note that options on the command-line
are dash-separated (e.g. `--js-port`), but options in config files are
camel-cased (e.g. `jsPort`). (TODO: Support dash-separated options in config)

#### --routes
The routes file to load.

Defaults to **"./routes.json"**.

#### --host
The hostname to use when starting up the server. If `jsUrl` is set, then this
argument is ignored, and any host name can be used.

Defaults to **localhost**.

#### --port, -p
The port to start up the main server, which will serve the pre-rendered HTML files.

Defaults to **3000**.

#### --js-port
The port to use when `react-server-cli` is serving up the client JavaScript.

Defaults to **3001**.

#### --hot, -h
Use hot reloading of client JavaScript. Modules that export React components
will reload without refreshing the browser. This option is incompatible with
--long-term-caching.

Defaults to **true** in development mode and **false** in production mode.

#### --minify, -m
Minify client JavaScript and CSS.

Defaults to **false** in development mode and **true** in production.

#### --long-term-caching
Adds hashes to all JavaScript and CSS file names output by the build, allowing
for the static files to be served with far-future expires headers. This option
is incompatible with --hot.

Defaults to **false** in development mode and **true** in production.

#### --js-url
A URL base for the pre-compiled client JavaScript; usually this is a base URL
on a CDN or separate server. Setting a value for js-url means that
react-server-cli will not compile the client JavaScript at all, and it will
not serve up any of the client JavaScript. Obviously, this means that --js-url
overrides and ignores all of the options related to JavaScript compilation and
serving: --hot, --js-port, and --minify.

Defaults to **null**.

#### --https

If true, the server will start up using https with a self-signed certificate.
Note that browsers do not trust self-signed certificates by default, so you
will have to click through some warning screens. This is a quick and dirty way
to test HTTPS, but it has some limitations and should never be used in
production. Requires OpenSSL to be installed.

Defaults to **false**.

#### --https-key

Start the server using HTTPS with this private key file in PEM format.
Requires `https-cert` to be set as well.

 Default is **none**.

#### --https-cert

Start the server using HTTPS with this cert file in PEM format. Requires
`https-key` to be set as well.

Default is **none**.

#### --https-ca

Start the server using HTTPS with this certificate authority file in PEM
format. Also requires `https-key` and `https-cert` to start the server.

Default is **none**.

#### --https-pfx

Start the server using HTTPS with this file containing the private key,
certificate and CA certs of the server in PFX or PKCS12 format. Mutually
exclusive with `https-key`, `https-cert`, and `https-ca`.

Default is **none**.

#### --https-passphrase

A passphrase for the private key or pfx file. Requires `https-key` or
`https-pfx` to be set.

Default is **none**.

#### --log-level
Sets the severity level for the logs being reported. Values are, in ascending
order of severity: 'debug', 'info', 'notice', 'warning', 'error', 'critical',
'alert', 'emergency'.

Default is **'debug'** in development mode and **'notice'** in production.

#### --help, -?
Shows command line options.

## API

You can also call `react-server-cli` programmatically. The module has a
named export, `run`, which takes has the following signature:

```javascript
import {run} from "react-server-cli"

run({
    command         : "start",
    routes          : "./routes.json",
    port            : 3000,
    jsPort          : 3001,
    hot             : true,
    minify          : false,
    compileOnly     : false,
    jsUrl           : null,
    longTermCaching : true,
});
```

The module also exports a `parseCliArgs` function that will let you implement
your own CLI:

```javascript
import {run, parseCliArgs} from "react-server-cli"

run(parseCliArgs());
```
