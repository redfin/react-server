# Understanding Rendering

Given that Triton is about using universal JavaScript to make server- and client-side rendering as similar as possible, it can be hard to understand which part of a large Triton application is rendering any given part of a "finished" html document.  This guide will help you understand how different parts of the rendering lifecycle take place, and how the final document is assembled.

On the server, in renderMiddleware, each component to render is represented by a promise that's resolved immediately if there's no data requirement, or when data resolves, if created by RootElements.createWhenResolved, or a similar function (note that this is ​_effectively_​ what happens; the actual rendering can happen out of order, but elements are streamed to the browser sequentially).

## On the server​
​*pre-timeout:*​
- for each promise for a React component (in order):
   - if it is resolved already, render the component returned by the promise and stream it to the client
   - if it isn't resolved, we'll wait until it is resolved ​_or_​ the timeout is hit.

​*when timeout is hit*​:
- for each promise that hasn't yet rendered (in order):
   - call getValue() -- we ​_force_ it to give us a component to render; by default, this is whatever component was passed to RootElement.createWhenResolved, but we render it _without_​ data being available, and stream it to the client as is.

- keep http connection open on server, streaming out `<script>` tags with new data responses as they resolve

## In the browser
- do an initial render of ​_all_​ components w/ whatever data was available server-side (so that react can re-attach without getting confused)
- set up data promises client-side for all data not yet received
- resolve promises on the store whenever new data arrives, until all data has arrived

The timeout, then, is the ​_maximum_​ amount of time we're willing to wait to render server-side before _any_ content is render in the browser.  To ensure that the final document is completed after the server has timed out, we're force-render everything server-side immediately following  the timeout, then let the client pick up where the server left off.  Some middleware components may render immediately, if they are first in the document and do not require an asynchronous data call, regardless of timeout.

For projects that ensure that elements on the page don't "jump" (change absolute location on the page) as other elements render in, they'll need to set the data wait on the server to a time that is longer than  if they don't have good no-data content in the widgets
- always render placeholder ​_something_​ server-side, even if they don't have data.
