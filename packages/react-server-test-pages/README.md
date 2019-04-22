# react-server-test-pages

This is a place for pages that let us play around with react-server features.
It's not necessarily for automated tests (though we could build some around
it), it's for interactive testing during development.

Setup (from the repo root):

```bash
$ npm run bootstrap
$ lerna run start --stream --scope 'react-server-test-pages'
```

Then hit http://localhost:3000/ to see what's available.

If you make changes in `packages/react-server` you'll need to `CTRL-C` and
re-build `react-server` to pick them up.

```bash
$ lerna run build --stream --scope 'react-server'
$ lerna run start --stream --scope 'react-server-test-pages'
```

If you wish to run the test server in debug mode, simply replace `start` with `debug`.

Add pages in `entrypoints.js`.  Instructions are at the top.
