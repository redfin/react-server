# react-server-test-pages

This is a place for pages that let us play around with react-server features.
It's not necessarily for automated tests (though we could build some around
it), it's for interactive testing during development.

Setup (from the repo root):

```bash
$ npm install
$ npm run bootstrap
$ cd packages/react-server-test-pages
$ npm install react-server-cli@../react-server-cli
$ npm install react-server@../react-server && npm start
```

Then hit http://localhost:3000/ to see what's available.

If you make changes in `packages/react-server` you'll need to `CTRL-C` and
re-run the last line of the setup to pull them in.

If you wish to run the test server in debug mode, simply replace `npm start` with `npm run debug`.

Add pages in `entrypoints.js`.  Instructions are at the top.
