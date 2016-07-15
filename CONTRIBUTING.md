Contributing Code to react-server
---------------------------------

## Want to help?

Great!  There's a lot to do!

You could:

- [Improve documentation][improve-documentation]
- [Fix bugs][fix-bugs]
- [Build new features][build-new-features]
- [Help triage issues][help-triage-issues]

Not sure where to start? Join us [on gitter](https://gitter.im/redfin/react-server) and ask!

## Getting started

React Server uses a tool called [lerna](https://www.npmjs.com/package/lerna) to
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

Most commands have a corresponding `lerna` command; if you want to find out more,
you can look at the `scripts` hash in the root `package.json`, check out the
[lerna docs](lernajs.io), and run the lerna commands yourself

```
npm i -g lerna david
lerna clean
lerna bootstrap
lerna run lint
lerna exec -- david u
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
