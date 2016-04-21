# react-server

React is an amazing library for client-side user interface, and it has the
added benefit of being able to be rendered on the server, which is crucial for
SEO, SEM, and user experience. However, server-side rendering in practice is
significantly more complicated than just calling `ReactDOM.renderToString` and
piping out the result, especially if you want to make sure your site loads
quickly in a mobile-first world.

`react-server`:
1. Smoothes out the common problems you run into with React server-side
   rendering.
1. Encodes performance best practices into the framework, making it easy to
   build high performance websites by default.

## What we talk about when we talk about performance

When we talk about performance in `react-server`, we're mostly talking about
_perceived performance_. We believe that
[WebPageTest](http://www.webpagetest.org/) is correct to focus on how much
time it takes from the moment the user navigates the browser until the content
above the fold is painted. There are other important perceived performance
metrics (like time to first content painted, time to all content painted, and
time to full interactivity), but in developing react-server, we have focused
most on reducing time to above-the-fold paint. WebPageTest's [Speed
Index](https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index)
is probably the best current measure of above-the-fold paint speed, as it
takes into account how quickly the content is painted during load, not just
the total time to full completion.

In order to facilitate blazing perceived performance, `react-server` implements the following:

* Parallelize backend queries
* Use a client-side data cache
* Stream HTML to the browser
* Render quickly, even when the backend is slow
* Enforce page hygiene
* Enable page-to-page transitions without code bloat
* Look forward to HTTP/2

We'll examine each of these in turn and discuss why it makes it easier for web developers to write fast front ends, **by default**.

## Parallelize backend queries

Traditional server-side rendering in frameworks like Ruby on Rails or Java
Servlets has suffered from the fact that calls to the backend are usually
synchronous. This means that every call to the backend to retrieve data
happens in serial, meaning that page latency is at least the sum of the
execution time of all backend requests. As a result, every feature added to a
page slows down the time to first byte, and performance of the page degrades
over time.

In traditional LAMP, LAMJ, or RoR stacks, attempts to optimize this problem
usually involve rewriting backend queries to retrieve more data at once,
lowering the roundtrip cost to the backend, but this is time-consuming,
error-prone, and often has unpredictable effects on performance, particularly
for systems that use RDBMSes as their data store. Developers who care about
performance have strong incentives to create bigger and more complicated
backend queries to keep performance acceptable, which creates instability
risk.

In `react-server`, we advocate for performing as much of the backend data
access as possible in parallel to speed up time to first byte from the server.
Thus, if there are 10 backend data calls that each take 50ms, the server can
theoretically finish access to the backend in 50ms rather than 500ms in a
traditional, serial stack. Additionally, developers working with
`react-server` and looking to speed up server performance have the right
incentives: they are encouraged to break down big backend queries into
smaller, more parallelizable queries. Smaller, more focused queries lower the
risk of strain on the backend. Performance work can also have the added
benefit of increasing stability.

Parallel data access is mostly facilitated by node itself, which is built for
highly asynchronous server applications. `react-server`, however, assumes that
you will access the backend in a massively parallel way, and it facilitates
building a user interface on top of parallel, asynchronous data access.

## Use a client-side data cache

One thing you quickly learn when you use React server-side rendering is that
you have to "reconnect" React on the client side to the HTML markup you
generated on the server side, and that's not always as easy as it seems.
Ideally, reconnecting goes something like this:

1. On the server side, call `ReactDOM.renderToString` on a React element that you
   wish to render. This returns a string that represents a document fragment.
   The root of that document fragment will have an attribute
   (`data-react-checksum`) that is a simple checksum of the text of the entire
   fragment.
1. The server returns the document fragment to the browser wrapped in an HTML page.
1. In the browser, once the document has been loaded, the JavaScript code runs
   again, this time calling `ReactDOM.render` on the React element and also
   passing in the root of the pre-rendered HTML in the document.
1. React will construct a virtual DOM and run its checksum on that virtual
   DOM. If the checksum matches the `data-react-checksum` embedded in the
   pre-rendered HTML, React knows that the browser DOM is already in sync with
   its virtual DOM, and React doesn't have to do any browser DOM operations.
   If React finds that the checksums differ, however, it will blow away the
   existing DOM and replace it with the contents of the virtual DOM. This is a
   potentially expensive operation, and you want to avoid it if you can.

The key lesson here is that when you send down pre-rendered markup from the
server, you must also send down the exact data you used to construct that
markup. If you don't, it's very likely that the virtual DOM you construct on
the client side will end up looking different than the HTML you generated on
the server side, and you will lose a major performance benefit of server-side
rendering.

In `react-server`, components on the server side load data via HTTP calls to
the backend services of their choice, and `react-server` packages all those
results into a **client-side data cache** that is sent down to the browser
along with the HTML markup. The client-side data cache ensures that when the
code runs again in the browser, it will have access to exactly the same data
that the server side code did, and the client will therefore generate exactly
the same DOM as the server did.

But a client-side data cache doesn't just help with correctness when
reconnecting client-side code to server-side markup; there's also a huge
performance benefit. The client-side data cache makes sure that data calls on
the client return instantly, as they don't require an expensive network call
to download data. From a developers perspective, this happens transparently
and by default.

## Stream pre-rendered HTML

Once we have parallel backend services and a client-side data cache, we're
well on our way to developing a web experience that has good perceived
performance.

However, as our page gets more longer and more fully featured, we run into
another problem: our entire page, from header to footer, needs to be generated
before we can send even the first byte to the browser. This means that the
browser is waiting for all of our backend calls to finish and for
`React.renderToString` to return on the server before it even sees a body tag.
We can easily lose hundreds of milliseconds or more during which the browser
could be parsing and even displaying above-the-fold content.

To solve this, `react-server` has the concept of a `RootElement`. Every page
in a `react-server` app has multiple `RootElements`, and they stream down to
the browser as soon as they are ready to render. That way, adding more content
to a page at the bottom need not slow down above-the-fold paint.

As a common example, imagine that we have a simple site where we want to show
a user his or her profile. The page has three main sections: header, profile,
and footer. While the profile section probably needs information from our
backend, it's likely that the header doesn't need any at all. If we make the
header its own `RootElement`, `react-server` will start streaming the header
to the browser immediately, without waiting on any backend services at all,
meaning that the user's browser can get a header back potentially within just
a few milliseconds. Browsers are well equipped to render partial pages, and
the user will be shown some content while the primary part of the page is
still loading.

## Render quickly despite a slow backend

Now we have a server that is executing backend requests in parallel, sending
down a client data cache, and streaming out HTML as soon as it's ready for the
browser. Added together, these features make it feasible for complicated,
interactive sites to paint on screen in hundreds of milliseconds on desktop
and under a second on mobile.

However, we still have a problem: in the real world, things go wrong, and
sometimes the backend is slow to respond. Maybe garbage collection is causing
a performance blip; maybe a DDoS has hit one of your APIs. Operations can be
unpredictable, and we need to degrade smartly in that case. What's worse, our
emphasis on parallel queries across many different backend servers can
increase the risk that we will encounter a server experiencing a performance
issue.

When server rendering is stuck waiting for a slow backend, there are three choices the server can make.

First, the server can just wait for as long as it takes for the backend to
return before rendering. Obviously, this is dangerous, as we have no idea how
long the backend will take. And in the meantime, the end user is getting no
feedback as to whether the site is making progress or not. If we leave the
user hanging for a second or three while we wait on the backend, we can expect
that he or she will walk away.

Second, the server can timeout and render the page using just the data that
did come back, re-requesting the offending endpoint on the client side. A page
will frequently depend on a dozen or more API endpoints, and it's often the
case that a reasonably usable page can be constructed even when one or two of
the data endpoints is missing. This requires some more care in UI coding, as
it's necessary to handle null data and display appropriate errors or loading
spinners, but it's a good strategy for getting the user back a degraded but
possibly usable experience. In this strategy we also re-issue the offending
data request on the client side and, if the data ever returns, we re-render
the page with the slowpoke data included.

While this second approach improves perceived performance at the cost of a
small amount of UI special case coding, it has one major flaw: it increases
both the latency of and load on the slow backend query.

To see how it increases latency, imagine that we have a page that is coded to
timeout and render at 300ms after the HTTP request comes in. Further, imagine
that nine of its backend queries complete in 50ms, but one laggard API is
consistently taking 400ms due to underpowered hardware. At 300ms after the
request, the server decides to render without the slow API data, and it sends
the rendered HTML down to the client. Let's assume that the browser takes
another 500ms to parse and display all the content, and it then re-issues an
XHR to retrieve the missing data call. It is now about 800ms after the initial
request, and we reset the clock on the slow data request. The slow API request
takes another 400ms to complete, meaning that the data doesn't get to the
browser until 1.2s after the first request, even though the actual latency was
a third of that.

What's worse, in this example we've doubled the load on an already fragile
service by making a call from both the server and the client. This is the kind
of design that cascading failures are made of: it creates a tipping point in
performance where a poorly performing service suddenly gets penalized with
double the traffic, potentially bringing the service down.

To see the third way that server rendering engines can deal with misbehaving
backends, notice that in our example, the slow data query has actually
returned at 400ms, while the browser is rendering the content that came down
from the server. We have the data on the server side, and if we could figure
out a way to send it down to the client, we'd be able to avoid both the extra
latency and the extra load on the backend.

It turns out that this is possible. By leaving the HTTP connection from the
server to the client open and not closing the HTML document with an `</html>`
tag, we can wait for the laggard data endpoint to return and then push it down
in an inline `<script>` tag when it completes. The client side code will see
this as an event that requires a re-render, and the slow data will be
incorporated into the page. We will paint for the user as early as possible,
and we won't increase the load on the backend service.

`react-server` implements this third strategy **by default**. A developer
doesn't need to do anything to get fault-tolerance and still have fast
painting for the end user.

## Enforce page hygiene through the `Page` API

Beyond data loading, there are a ton of frontend best practices that have been
known for years, primarily around how to load CSS and JavaScript in the most
performant way. [Steve Souders](https://www.stevesouders.com/) pioneered this
field with his books [High Performance
Websites](http://www.amazon.com/dp/0596529309?tag=stevsoud-20&camp=14573&creative=327641&linkCode=as1&creativeASIN=0596529309&adid=00GNM1ZWW77KSD0RERXN&)
and [Even Faster
Websites](http://www.amazon.com/dp/0596522304?tag=stevsoud-20&camp=213381&creative=390973&linkCode=as4&creativeASIN=0596522304&adid=09TZDJ7Z5GDMJPAM6XC6&),
and others have built on that work.

Unfortunately, though, although these rules are fairly  well-known, they can
be hard to follow in practice. Even if you have a page that follows all of the
rules perfectly, over time other engineers come in and add features that make
performance mistakes. A single external synchronous JavaScript file can
obliterate months of careful performance work. Regular performance testing is
one way to guard against mishaps, but it requires a lot of infrastructure and
operational complexity.

In `react-server`, we've attempted to implement well-known asset loading
performance practices by default, and when possible make it impossible for
developers to contravene them. Our `Page` API requires that developers define
their CSS and JavaScript in a structured way, and since there is no way for
developers to write directly to the output stream, there simply is no way for
them to include those assets in incorrect ways. For example, there is
literally no way in `react-server` to load a JavaScript file in a blocking
manner (which is the default in most browsers and depressingly common on the
web).

Furthermore, as new asset loading best practices are discovered and refined,
they can be centrally implemented in `react-server` without changing client
code. Providing an API between the developer and the HTML written out allows
forward compatibility with new performance gains.

## Enable single page applications without code bloat

Navigating to a new page is one of the slowest things that happens in modern
web apps. A new HTML page needs to be generated and downloaded, and only then
will CSS and JavaScript be downloaded, parsed, and executed. Even
well-architected pages will have dependencies which can add serial steps to
the page load waterfall, and many developers underestimate how long it takes
to parse and execute JavaScript.

To combat this, over the past decade some in the web developer community have
embraced the [single-page
application](http://en.wikipedia.org/wiki/Single-page_application), or SPA.
The idea behind an SPA is that the browser downloads all the code for an
application on first page load. The upside to this is that when a user clicks
on an internal link that would normally download a new HTML page and force a
reparsing of CSS & JavaScript, the app can instead simply use XHR to download
the data for the new page and generate the new page on the fly through DOM
manipulation.

This potentially makes page-to-page transitions quite quick, but it has a more
sinister effect on the application's first load time. As you add new pages to
the app, the first load time gets longer and longer; large SPAs can easily end
up having megabytes of JavaScript on first load if not optimized. What's
worse, the code that's being preloaded is often not needed, as it's unlikely
that a user will click on every different page in an app.

While many SPA frameworks [have ways](https://oclazyload.readme.io/) to
lazy-load code for developers who are looking to optimize, in `react-server`,
lazy loading is **built-in as the default**. In `react-server`, the developer
declaratively defines the logical Pages in their app. When a user navigates to
a URL, only the CSS and JavaScript for that page is loaded into the browser.
When the user navigates to a second page in your app, the CSS & JavaScript for
that second page is automatically asynchronously loaded (and the CSS for the
first page is automatically removed from the page so as not to cause rendering
bugs). Under the covers, `react-server` uses
[webpack](http://webpack.github.io/) to lazily load code. This ensures that
page-to-page navigation is fast, but that adding new pages to an app doesn't
slow it down.

## Look ahead to HTTP/2

Finally, we believe that `react-server` puts developers ahead of the game in
the transition from HTTP/1.x to HTTP/2. **We haven't implemented any HTTP/2
support yet**, but we believe our APIs and performance optimizations will
translate very well to HTTP/2. A few of the ideas we have for HTTP/2 are:

* **Server Push for CSS and JavaScript**: Currently in `react-server`, the
  server knows which CSS files and JavaScript files are associated with a
  particular page very early in the rendering process, but we have to wait for
  the document head to be sent down to the browser and for the browser to turn
  around and request the assets. This is exactly the scenario that Server Push
  was made for; `react-server` could start pushing CSS and JavaScript files as
  soon as the HTTP request connection is made. As an added benefit, the first
  100 or 200ms of an HTTP connection are often a dead time in the
  client-server connection as the server works on rendering, so the bandwidth
  is underutilized. Pushing CSS and JavaScript will use bandwidth better and
  potentially even help overcome TCP slowstart.

* **Server push of API endpoints**: In the current version of `react-server`,
  the backend API results are sent down in a client-side cache, as noted
  above. That cache is implemented as an inline `<script>` tag in the HTML
  page, and it works, but it could be better. First, it doesn't use the
  browser cache when an API result is cacheable. Second, we currently wait
  until the end of the page to send down the client-side cache, as we don't
  want to block sending down markup. With server push, we could fix both of
  these problems. API endpoints would be pushed separately and therefore
  cacheable by URL, and interleaving of streams would mean that we could send
  down API results as soon as we get them without blocking the sending of HTML
  markup.

* **Server push of other assets, such as images**: Further down the road, we
  suspect it will be possible to put hooks into the rendering to pre-emptively
  send down images before our HTML finishes rendering.

* **Use stream priority as a way to tune performance** As web networking guru
  Ilya Grigorik [has
  written](http://chimera.labs.oreilly.com/books/1230000000545/ch13.html#_removing_1_x_optimizations),
  the transition to HTTP/2 will mean that developers will need to unlearn the
  performance habits they learned in HTTP/1.x. We believe that a performant
  HTTP/2 implementation will involve the browser downloading more independent
  HTTP resources than HTTP/1, but they will of course be multiplexed over a
  single TCP connection. Using stream priority smartly with application logic
  may become critical for best HTTP/2 performance, and `react-server` will be
  positioned perfectly to test out the best way to tune that.

## Final thoughts

React is rightly celebrated for its speed and ease-of-coding when rendering in
the browser, but it requires some extra help to be truly fast on the
server-side as well. `react-server` provides that help, and we've seen really
fantastic performance results so far in our own site. However, we know that we
built this for ourselves, and we're certain that there are use cases we never
considered. Please let us know what we missed  so that we can make
`react-server` a robust server-side rendering solution for React that truly
guarantees great performance by default. Thanks!
