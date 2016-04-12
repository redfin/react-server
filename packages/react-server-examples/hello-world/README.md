# react-server-examples/hello-world

Very simple example project for `react-server` which only shows server rendering and interactivity on the client side.

To install:

```
git clone http://redfin/react-server.git
cd react-server/packages/react-server-examples/hello-world
npm install
```

To start in development mode:

```
npm start
```

Then go to [localhost:3000](http://localhost:3000/). You will see a simple page that pre-renders and that is interactive on load. It also will include hot reloading of React components in their own file.

If you want to optimize the client code at the expense of startup time, type `NODE_ENV=production npm start`. You can also use any of [the other arguments for react-server-cli](../../react-server-cli#setting-options-manually) after `--`. For example:

```
# start in dev mode on port 4000
npm start -- --port=4000
```
