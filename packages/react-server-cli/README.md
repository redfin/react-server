# react-server-cli

A simple command line app that will compile a routes file for the client and
start up express. To use:

1. `npm install --save react-server-cli react-server`
2. Add `./node_modules/react-server-cli/bin/react-server-cli` as the value for
 `scripts.start` in package.json.
3. `npm start` from the directory that has your routes.js file.


## What It Does

The CLI builds and runs a `react-server` project, using Express. It compiles
JS(X) and CSS into efficiently loadable bundles with code splitting using
webpack, and it supports hot reloading of React components on the client-side
during development.

## Find out more

See the
[React Server CLI guide](http://react-server.io/docs/guides/react-server-cli)
