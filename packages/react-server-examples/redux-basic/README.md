## Basic Redux Counter app
An example of the official [Redux Counter](https://github.com/reactjs/redux/tree/master/examples/counter) app powered by react-server.

### Quck Start
Install npm dependencies:
```
npm install
```

Start react-server in development mode:
```
npm start
```

In a seperate shell, open app in browser:
```
npm run open
```

### Description
* In counter-app/index.js, the Redux store is initialized by passing a reducing function into [`createStore()`](http://redux.js.org/docs/api/createStore.html).

* The store is passed into the react-redux's [`<Provider />`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store) component. This makes the Redux store available to the [`connect()`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) calls in the component hierarchy below.

* The [`connect()`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) is used in the `<Counter />` component which gives the component access to the Redux store.

* The [`store.dispatch()`](http://redux.js.org/docs/api/Store.html#dispatch) functions are passed down as props in the `<Counter />` component. These are used to dispatch increment & decrement actions, which mutate the Redux store.

**Note**: Single Redux store lives in pages/store.js. In a larger application, you can combine multiple reducers from multiple pages with [`combinedReducer()`](http://redux.js.org/docs/api/combineReducers.html) to instantiate a single Redux store.