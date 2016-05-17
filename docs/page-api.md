# Route
A binding of URL paths to a Page class that can render the results for those URLs.

`path: String | RegEx | [ String | RegEx ]`

* A string or regex that will be tested against the path of the URL to
  determine if this route applies.

`method, optional: String | [String]`

* The HTTP method(s) that are acceptable.

* Default: “get”

`page: Page`
* The page to render

#Page

An HTML page to be rendered. Note that this Page may be rendered as a result
of either an HTTP request or a client-side navigation. The Page’s core
responsibilities are to:

* handle redirects or forwarding to other pages
* translate the URL/request into any necessary backend data requests
* produce all of the elements to be included in the HTML Page `<head>`.
* produce one or more ReactElements that will render the page

The rendering process follows the following flow:

1. The request is compared to all the routes, and a Page constructor is
   retrieved.
1. The Page constructor is called.
1. `setConfigValues` is called.  This method may return an object representing
   configuration overrides for the page.
1. `handleRoute` is called with the current Request to determine if this
   request needs to be redirected or forwarded.
 * If a redirect is returned (code 301 or 302), the user-visible URL will
   change, and the routing process will start again at step #1.
 * If a forward is returned (a Page constructor), then routing will jump back
   to step #2 with the new Page constructor.
 * Otherwise, continue on.
1. If they exist, `getTitle`, `getScripts`, `getSystemScripts`,
   `getHeadStylesheets`, `getMetaTags`, and `getBodyClasses` are called, and
   their results are written into the head of the response (via
   `response.write` on server and DOM operations on the client). On the
   server, if any of those methods return a Promise, the writing of the
   ReactElements is blocked until the Promises resolve. On the client,
   ReactElements can be written out to the document body before the title or
   meta tags are resolved.
1. `getElements` is called, and the resulting ReactElements are rendered and
   written out to the document in the order they were returned from
   getElements. On both client and server side, rendering of element N will
   always block on rendering of element N - 1. We may ease this restriction
   later.
1. If a timeout is reached on the server, the EarlyPromises of ReactElements
   may be forced to resolve via `getValue`, and the resulting elements will be
   rendered and written out to the document. If `getElements` returns a
   Promise that is not an EarlyPromise, then nothing will be written out in
   the case of a timeout.


# Page methods

There are three groups of methods that are relevant to page objects, and they
are all defined in simple data structures with ample commentary near the top of
react-server/core/util/PageUtil.js.  That is the authoritative reference for the
react-server page interface.

* Please see: `react-server/core/util/PageUtil.js`

## Static methods

`constructor()`

`static middleware() : [Page classes]`

* An array of page classes that should be used as mixins for this page. See
  Middleware section below to see what these are for.

## PAGE_METHODS

Each of these methods receives a function, `next`, as its sole argument.
This `next function may be used to call the default implementation of the
function in question.

`handleRoute(request:Request, loader:Loader, next: Function), optional:
{code?: int, location?: String, page?:Page} | Promise({code?: int, location?:
String, page?:Page})`

* This method is called before any of the other methods, and its purpose is to
  kick off any async data fetching the page needs to do and to make sure that
  we are on the correct page. It returns an object (or Promise of object) that
  always has a `code` field, which is the HTTP result code to return.

* `handleRoute` takes in a Request object so that the Page will know exactly
  what information it should display. For best performance, the Page should
  start any data requests that are necessary for first render in handleRoute.

* The Loader is an HTTP loading interface that supports client caching of
  results in HTML and late arrival of HTTP responses that occur after a
  rendering timeout.

* If the `code` is 301 or 302, then it must also return a `location` String to
  tell the browser where to redirect.

* If the `handleRoute` returns an object with a `page` property and no `code`
  property, then the current page object is thrown away, and routing forwards
  control to the page that was returned, starting with `handleRoute()`. This
  is helpful for having centralized error pages for things like 404 Not Found
  or 500 Server Error.

* Note that HTTP codes will not be returned when performing client-side page
  transitions. However, 302 and 301 codes will use the History API to change
  the URL on client-side transitions, resulting in an effective redirect. For
  browsers that do not support the History API, the browser may load the new
  page from scratch.

* The other methods in this Page object will not be called until and unless
  the result from `handleRoute` resolves and the return value has a `code`
  property.

* Default: `{code:200}`

`getTitle(next: Function), optional: String | Promise(String)`

* A string (or promise thereof) that is the title of this page.

* Default: “”

`getScripts(next: Function): String | Script | [String | Script]`

* URLs for the script files that should be loaded in the head for this page.

`getSystemScripts(next: Function): String | Script | [String | Script]`

* URLs for the critical client-side JavaScript files that make react-server
  run on the client side, including both the react-server runtime, this page
  class, and its bundled dependencies. Do not override this method unless you
  are doing something very tricky, like packaging react-server for the client
  with something other than the standard Webpack.

* Default: the URLs of the files that react-server needs to run on the client-side.

`getHeadStylesheets(next: Function): String |  Style | [String | Style]`

* URLs for the stylesheets that should be loaded in the head for this page.

* If the method returns a `String` value, it is interpreted as a `Style` of
  the form `{href:<value>, type:"text/css"}`.

`getMetaTags(next: Function): Meta | Promise(Meta) | [Meta | Promise(Meta)]`

* A set of Meta objects that represent the meta tags for this page. If it’s a
  promise and the promise returns null, the meta tag will not be used.

* Default: []

`getLinkTags(next: Function): Link | Promise(Link) | [Link | Promise(Link)]`

* A set of Link objects that represent the link tags for this page. If it’s a
  promise and the promise returns null, the link tag will not be used.

* Default: []

`getBase(next: Function): Base | Promise(Base | null) | null`

* Returns the value of the HTML `<base>` tag. If null, there will be no <base>
  tag in the head.

* Default: null

`getBodyClasses(next: Function): Classes | Promise(Classes)`

* Returns an array of classes to add to the `<body>` tag.

* Default: []

`getElements(next: Function): ReactElement | EarlyPromise(ReactElement) |
Promise(ReactElement) | [ ReactElement | EarlyPromise(ReactElement) |
Promise(ReactElement) ]`

* The React elements, in page order, which make up the HTML of this Page. For
  convenience, you can return a single element or an array of elements.

* When an array is returned, each of the elements will be put in a separate
  container div, which will be siblings of each other. If an element is null,
  it will not result in anything rendered to the document.

* If the any of the return values are EarlyPromises, they may be rendered in a
  partial state using `getValue`.

`getResponseData(next: Function): String | Buffer | Promise(String) | Promise(Buffer)`

* This method is only part of the "raw response" page lifecycle.  See

`getHttpHeaders(next:Function): HttpHeader | Promise(HttpHeader) | [HttpHeader | Promise(HttpHeader)]`

* The set of HTTP headers that should be sent back from this page. Has no
  effect when a page is transitioned to on the client.


## PAGE_HOOKS

These are additional methods that a page/middleware may implement.

`setConfigValues()`: Config object

Return configuration overrides for the page.

`addConfigValues()`: Config object

Add new configuration values, with defaults (only used by middleware).

`handleComplete()`: Called when the request is complete and the full response has been sent.

### Config values

There are two config values that are honored by the navigator

* `isFragment` (boolean) indicates a response is a fragment of a page, rather than a full page
* `isRawResponse` (boolean) indicates a response is to be served as-is


## PAGE_MIXIN

These are methods that are automatically made available on the page object.
The page may call these methods on itself.

`getRequest()`: Get the request object (see "Request", below)

`getConfig(key)`: Get a single page configuration value.

`getExpressResponse()`: Get the express response object (only available for raw response pages).

# Middleware

Middlewares are objects that implement any subset of the Page API and are
called before a `Page` in a chained fashion. If a middleware doesn’t implement
a method, it is skipped. If a middleware does implement a method, it can
completely handle the method (thereby completely ignoring the Page’s
implementation), or it can pass through to the Page’s implementation using the
`next` argument.

# Request

The request that led to rendering a page, which is similar to a standard
Express Request but is somewhat more constrained because of the need to be
applicable on both client and server side. Note that several methods return
special “not available” values when run on the client side.

`getUrl(): String`

`getBody(): ReadableStream`

`getMethod()`

`getRouteName() : String`

* Gets the name of the route that is currently being matched.

`getHttpHeader(name: String): String | Request.HEADERS_NOT_AVAILABLE`

* Gets the value for a particular HTTP header. If this is a client-side page
  transition, then the response will always be Request.HEADERS_NOT_AVAILABLE.

`getHttpHeaders(): Object | Request.HEADERS_NOT_AVAILABLE`

* Returns all the HTTP headers as name:value pairs. If this is a client-side
  page transition, then the response will always be
  Request.HEADERS_NOT_AVAILABLE.

`getCookie(name: String): String`

* Retrieves the value of the cookie with the specified name. Note that
  httpOnly cookies will not be available on the client-side.

`getCookies(): Object`

* Returns all cookies as name:value pairs. Note that httpOnly cookies will not
  be available on the client-side.

# EarlyPromise(T) extends Promise(T)

A Promise that can be interrupted and forced to return a value while still
pending, perhaps with a value that is only partly finished. The main use case
is for timeouts that fire before Promise fulfillment, but for values that
could be useful in a partially finished state (imagine an image that could be
useful, if fuzzy, when half-decrypted). This allows the client to retrieve a
partially usable value even if the Promise never fulfills.

`getValue(): T`

* Returns the value of the Promise, perhaps in a partially completed state if
  the promise is still pending. May return null if there is nothing of
  interest yet available. If the promise has already fulfilled, then get
  **MUST** return the value that was resolved. If the promise rejected, then
  get **MUST** throw that same error.

* This method **MUST NOT** throw an error if it is fulfilled or pending.
