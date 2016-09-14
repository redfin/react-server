Contributing Code to react-server
---------------------------------

## Want to help?

Great!  There's a lot to do!

You could:

- [Improve documentation][improve-documentation]
- [Fix bugs][fix-bugs]
- [Build new features][build-new-features]
- [Help triage issues][help-triage-issues]

Not sure where to start? Join us [on slack](https://slack.react-server.io/) and ask!

## Getting started

React Server uses a tool called [asini](https://www.npmjs.com/package/asini) to
manage the entire React Server ecosystem in a single repository.  This allows
maintainers to know that everything works together well, without having to know
all of the inner workings of each package in the monorepo.  It does present some
challenges to new developers, since the idea is relatively new.  If you want to
know more about why we chose a monorepo, check out the [babel monorepo design
doc](https://github.com/babel/babel/blob/master/doc/design/monorepo.md),
especially the [previous discussion](https://github.com/babel/babel/blob/master/doc/design/monorepo.md#previous-discussion).

To get your local clone into working order, run an

```
npm run bootstrap
```

If things get hairy and you have errors that you don't understand, you can get
a clean install of all the dependencies

```
npm run nuke
npm run bootstrap
```

If you've been running `bootstrap` to track down build errors a lot, and have a
lot of debug files lying around, you can clean them up

```
npm run clean
```

Most commands have a corresponding `asini` command; if you want to find out more,
you can look at the `scripts` hash in the root `package.json`, check out the
[asini docs](https://github.com/asini/asini), and run the asini commands yourself

```
npm i -g asini david
asini clean
asini bootstrap
asini run lint
asini exec -- david u
```

You can also work on a single package by `cd`-ing into that module, and using
normal `npm` scripts

```
cd packages/generator-react-server
npm i
npm test
```

but you should still run a full monorepo build and test before submitting a pr.

## Testing

Yeah!  Do it!

Head over to [react-server-test-pages](/packages/react-server-test-pages) and
check out the README to get a test server set up.

Add some automated [integration
tests](/packages/react-server-integration-tests) if you're up for it.

If nothing else, check for regressions:

```bash
npm test
```

That will, among other things, run [`eslint`](/.eslintrc).

If you would like to test your changes in [React Server
core](/packages/react-server) in a project from outside of the monorepo, you'll
need to use `npm install` with a local file path to do it.

```bash
cd /path/to/my/project
npm install /path/to/react-server/packages/react-server
```

Make sure you install the path to [React Server core](/packages/react-server),
instead of the monorepo root, or else you'll get the following error

```
npm ERR! addLocal Could not install /Users/vince.chang/code/react-server
npm ERR! Darwin 15.2.0
npm ERR! argv "/path/to/node/v4.3.1/bin/node" "/path/to/node/v4.3.1/bin/npm" "i" "/path/to/react-server"
npm ERR! node v4.3.1
npm ERR! npm  v2.14.12

npm ERR! No name provided in package.json
npm ERR!
npm ERR! If you need help, you may report this error at:
npm ERR!     <https://github.com/npm/npm/issues>

npm ERR! Please include the following file with any support request:
npm ERR!     /path/to/my/project/npm-debug.log
```

You can't use  `npm link`, since when you `npm link /path/to/react-server`,
React Server and your instance will use separate versions of `react`,
`request-local-storage`, `q`, `superagent` &c, which introduces bugs in React
Server. Even if you were to remove all those singleton modules from your client,
or from React Server code, then you’d still have problems, because
`react-server` doesn’t have access to your instance's dependencies, and vice
versa.

Note that if you would like to test changes in a fork of React Server, you can't
install from your github fork because it will attempt to install the monorepo
instead of React Server core, and the monorepo is not a valid node module.
Instead, we recommend you publish a test version into a npm private repository,
like [npm Enterprise](https://docs.npmjs.com/enterprise/index) or
[Sinopia](https://github.com/rlidwka/sinopia).

If you add a new test that starts a server, make sure to update the
testing port registry to make sure there aren't any conflicts.  Our
CI test target runs many packages' tests simultaneously, so its
important that every server starts on a unique port.  You can find
the manifest in the docs.

## Contributor License Agreement

To get started, please [sign the Contributor License
Agreement](https://cla-assistant.io/redfin/react-server). The purpose
of this license is to protect contributors, Redfin, as well as users
of this software project. Signing this agreement does not affect your
rights to use your contributions for any other purpose.

## Code of Conduct

Please note that this project is released with a [Contributor Code of
Conduct](/CODE_OF_CONDUCT.md).
By participating in this project you agree to abide by its terms.

## Thanks!

Thanks for contributing!


[improve-documentation]: https://github.com/redfin/react-server/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3Adocumentation
[fix-bugs]: https://github.com/redfin/react-server/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+label%3Abug
[build-new-features]: https://github.com/redfin/react-server/issues?q=is%3Aopen+is%3Aissue+label%3A"help+wanted"+label%3Aenhancement
[help-triage-issues]: https://github.com/redfin/react-server/issues
