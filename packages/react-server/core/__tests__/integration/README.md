# Testing `react-server`

This directory contains integration tests that test the core features of `react-server` as a server and client framework. Tests for specific modules can be found in `__tests__` subdirectories as siblings of those modules.

## To run all the tests

1. cd to the `react-server/packages/react-server` directory.
1. If you haven't ever run tests before: `npm install -g gulp`.
1. `gulp test`

You should see something like:

```
$ gulp test
[09:31:12] Using gulpfile ~/code/main/react-server/packages/react-server/gulpfile.js
[09:31:12] Starting 'compileServer'...
[09:31:12] Starting 'compileClient'...
[09:31:14] Finished 'compileServer' after 2.16 s
[09:31:14] Finished 'compileClient' after 2.15 s
[09:31:14] Starting 'test'...
..................................................

50 specs, 0 failures
Finished in 0 seconds
[09:31:27] Finished 'test' after 13 s
```

Each little green dot is a test spec that passed. Every red "F" is a test that failed, but you probably know that if you have written Jasmine tests before.

## Tutorial: Writing an integration test

We're using [Jasmine 2.3.x](http://jasmine.github.io/2.3/introduction.html) as our test runner. Most tests take the following form:

1. Create a `Page` class that exercises the `react-server `functionality that you want to test.
1. Write a Jasmine spec that starts up a server with that page and then fires up a [Zombie](https://github.com/assaf/zombie) browser to make assertions about the rendered content.

### Creating a `Page` class that exercises `react-server`

Let's say that we wanted to just test that `react-server` will render a simple "Hello, world!" page.

First, make a subdirectory of `core/__tests__/integration`, called "helloWorld". By convention, Spec files and Page files should not be placed in the `integration` directory. I expect that most of these directories will have one Spec file and one or more Page files, but it's certainly reasonable to put multiple related Spec files in a directory together.

Next, we'd write a `Page` class that exercises the  functionality we want to test in `react-server`:

```
// react-server/core/__tests__/integration/helloWorld/HelloWorldPage.js

// React is required because we have JSX.
var React = require("react");

class HelloWorldPage {
  getElements() {
    return <div id="foo">Hello, world!</div>;
  }
}

// Remember to export the page class! I can't tell you
// how many times I've forgotten to do so.
module.exports = HelloWorldPage;
```

### Creating a `Spec` file to test the `Page`

Next, write a `Spec` file that will:

1. start up a server running `react-server`,
1. instantiate a Zombie browser against the page,
1. run some assertions against the browser before the client-side JavaScript runs, after the client-side JavaScript runs, and after a client-side transition.

Luckily, there are a lot of helper functions wrapped up in `core/test/specRuntime/testHelper` that do most of the heavy lifting:

```
// react-server/core/__tests__/integration/helloWorld/HelloWorldSpec.js
var helper = require("../../../test/specRuntime/testHelper");

describe("A basic page", () => {

  // starts up a server once before all the tests run
  // and maps the url "/hello" to HelloWorldPage.
  helper.startServerBeforeAll(__filename, [
    "./HelloWorldPage",
  ]);

  // Make sure to shut the server down.
  helper.stopServerAfterAll();

  describe("can say 'Hello, world!'", () => {
    // run an assertion against the doducment on the server-rendered
    // HTML, the client-rendered HTML, and the client transition-
    // rendered HTML.
    helper.testWithDocument("/helloWorld", (document) =>{
      expect(document.querySelector("div#foo").innerHTML).toMatch("Hello, world!");
    });
  });
});
```

The helper method `startServerBeforeAll` fires up an Express server with the pages you hand to it, and it automatically makes a URL for the page based on the name of the page class (although you can hand it custom URLs if you like; see below).

The other interesting method here is `testWithDocument`; that method creates three different Jasmine test specs, one for each of the environments where `react-server` can render a page: server, client, and client transition. `testWithDocument` runs the callback passed to it once for each test. So, although it look like you only wrote one test, here, there are actually three Jasmine specs, and you can be sure that Hello World rendering is working in all three environments.

Note that the file must end with "Spec.js" or "spec.js" to be recognized as a test by the framework.

And that's it for testing the rendered HTML of `react-server`! If you want to do more complicated tests, check out the `testHelper` API below.

## The `testHelper` API

`testHelper` should give you the basic tools you need to write most tests, including the ability to use the same test code on server, client, and client transition environments.

### `startServerBeforeAll(specFileName, routes: Object | Array[String])`

This method should be called inside a describe function to set up `react-server` with the page classes passed in once before all the tests start.

If the argument is an Object, it is interpreted as a map of URLs to **paths to page class files**. Note that it is **not** actual JavaScript objects. Never do this:

```
// STOP. DON'T. COME BACK.
helper.startServerBeforeAll({
    "/myPage": require("./myPage/MyPage"),
    "/myOtherPage": require("./myPage/MyOtherPage")
  });
```

This will not work, because you have required the file rather than passing the path to the file. You should instead use:

```
// Yes, my pretties.
helper.startServerBeforeAll({
    "/myPage": "./MyPage",
    "/myOtherPage": "./MyOtherPage"
  });
```

We need a file path and not a class because we need to be able to package up these routes with webpack, which deals solely with files.

If, as is common, you just want to use the class name as the URL, you can use a shorthand and pass an array of `Page` class files. The word "Page" will be stripped from the end and the first letter will be lower cased:

```
// creates a server with two URLs: /my and /myOther
helper.startServerBeforeAll([
    "./MyPage",
    "./MyOtherPage"
  ]);
```

The port used is either `process.env.PORT` or a predetermined hard-coded value. Whatever the value is, it will be used in all the `getXXXBrowser`/`getXXXWindow`/`getXXXDocument` calls.

### `stopServerAfterAll`

This method should be called inside a `describe` function where `startServerBeforeAll` was called. It will clean up the server that was started after all the specs finish.

### `startServerBeforeEach` & `stopServerAfterEach`

These are just like `startServerBeforeAll` and `stopServerAfterAll`, except that they create and tear down the server once for every spec. I've not yet found a good use for them, as they are slower than the `All` versions, but I thought I'd included them for completeness.

### `testWithDocument(url: String, testCallback:Function(document, done?))`

The primary method for testing what HTML has been generated by `react-server`. This method creates three specs (one each for server-generate HTML, client-generated HTML, and client transition-generated HTML), and it runs `testCallback` on the resulting HTML document once per spec.

You can use any standard DOM operations on the document, such as querySelectorAll or innerHTML, to examine the resulting document tree.

Note that this method is really best for testing rendered HTML. If you want to test a side effect of the client-side JavaScript, this is the wrong method to use because the server-generated HTML spec has JavaScript turned off. For those kinds of tests, use `testWithWindow`.

If you have a `done` argument in your callback, the specs will be asynchronous, and you are responsible for making sure `done` gets called.

### `testWithWindow(url: String, testCallback:Function(window, done?))`

The primary method for testing JavaScript effects in a rendered page. This method creates two specs (one each for client-generated HTML, and client transition-generated HTML), and it runs `testCallback` on the resulting window object once per spec.

The `testCallback` will be called after all asynchronous methods have executed in the client.

Note that this method is really best for testing effects of the client-side JavaScript. If you want to test the structure of the HTML rendered by a `Page`, this is the wrong method to use because the server-generated HTML will not be tested. For those kinds of tests, use `testWithDocument`.

If you have a `done` argument in your callback, the specs will be asynchronous, and you are responsible for making sure `done` gets called.

### `getServerDocument(url: String, callback: Function(document))`

Visits the `url` and returns a document object once the server has rendered the HTML but without running any client JavaScript. Does not create a Jasmine spec. Generally, you will use `testWithDocument`, but `getServerDocument` is useful if you know you don't want to test on client or client transition.

### `getClientDocument(url: String, callback: Function(document))`

Visits the `url` and returns a document object once all the the client JavaScript has run. Does not create a Jasmine spec. Generally, you will use `testWithDocument`, but `getClientDocument` is useful if you know you don't want to test on server or client transition.

### `getTransitionDocument(url: String, callback: Function(document))`

Visits a dummy page, and then clicks on a `react-server` `Link` to visit the `url` and returns a document object once all the the client JavaScript has run. Does not create a Jasmine spec. Generally, you will use `testWithDocument`, but `getTransitionDocument` is useful if you know you don't want to test on server or client first load.

### `getServerWindow(url: String, callback: Function(document))`

**Not implemented** because window is generally used to test JavaScript side effects, and JavaScript doesn't run in server-side rendering. You should probably use `getServerDocument` to test the HTML or `getServerBrowser` if you really want to do some crazy low-level assertions.

### `getClientWindow(url: String, callback: Function(window))`

Visits the `url` and returns a window object once all the the client JavaScript has run. Does not create a Jasmine spec. Generally, you will use `testWithWindow`, but `getClientWindow` is useful if you know you don't want to test on client transition.

### `getTransitionWindow(url: String, callback: Function(window))`

Visits a dummy page, and then clicks on a `react-server` `Link` to visit the `url` and returns a window object once all the the client JavaScript has run. Does not create a Jasmine spec. Generally, you will use `testWithWindow`, but `getTransitionWindow` is useful if you know you don't want to test on client first load.

### `getServerBrowser(url: String, callback: Function(browser))`

Visits the `url` and returns a Zombie browser object once the server has rendered the HTML but without running any client JavaScript. Does not create a Jasmine spec.

### `getClientBrowser(url: String, callback: Function(browser))`

Visits the `url` and returns a Zombie browser object once all the the client JavaScript has run. Does not create a Jasmine spec.

### `getTransitionBrowser(url: String, callback: Function(browser))`

Visits a dummy page, and then clicks on a `react-server` `Link` to visit the `url` and returns a Zombie browser object once all the the client JavaScript has run. Does not create a Jasmine spec.

### `getPort`

Returns the port number being used to launch `react-server` servers. Useful if you want to manually fire up a Zombie browser and point it at the server.
