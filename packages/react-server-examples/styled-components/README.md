# react-server-styled-components

Very simple example project for `react-server` using `styled-components`

To start in development mode:

```shell
npm start
```

Then go to [localhost:3000](http://localhost:3000/). You will see a simple page
that pre-renders with [`styled-components`](https://github.com/styled-components/styled-components)
and that is interactive on load. It also will include hot
reloading of React components in their own file.

If you want to optimize the client code at the expense of startup time, type
`NODE_ENV=production npm start`. You can also use any
[react-server-cli arguments](../../react-server-cli#setting-options-manually)
after `--`. For example:

```shell
# start in dev mode on port 4000
npm start -- --port=4000
```

# Running the tests

To run the tests

```shell
npm test
```

There are three tests called by the testing target; to run them independently
you'll likely want to install some dependencies globally

```shell
npm i -g eslint eslint-plugin-react babel-eslint ava nsp
```

The first test is a linter, which checks for common bugs and code style; you can
run it with `eslint <file-or-directory>`.

The second test is a security auditing test, which checks for known security
issues with the installed dependencies; you can run it with `nsp check`.

The last test is an end-to-end test, which starts the server and checks that it
serves pages correctly; you can run it with `ava test.js`.
