Given that react-server is about using universal JavaScript to make server-
and client-side rendering as similar as possible, it can be hard to understand
which part of a large react-server application is rendering any given part of
a "finished" html document.  This guide will help you understand how different
parts of the rendering lifecycle take place, and how the final document is
assembled.

On the server, in `renderMiddleware`, each component to render (returned by
`getElements`) is represented by a promise.  The promise may be resolved
immediately if there is no data requirement.  Note that the actual rendering
can happen out of order, but elements are streamed to the browser
sequentially.  The easiest way to create a promise that resolves at the right
time is to use `RootElement` and `RootContainer` components.  These have
`when` and `listen` properties that can be used to schedule render on the
server (and, in the case of `listen` _update_ in the browser).

```javascript
getElements() {
	return <RootContainer>
		<RootElement when={headerPromise}>
			<Header />
		</RootElement>
		<RootContainer listen={bodyEmitter}>
			<MainContent />
			<RootElement when={sidebarPromise}>
				<Sidebar  />
			</RootElement>
		</RootContainer>
		<TheFold />
		<Footer />
	</RootContainer>
}
```

In the example above:
- `<Header />` will render once `headerPromise` resolves, and it will receive
  props from the object that it was resolved with (if any).
- `<MainContent />` will render when `bodyEmitter` first fires, and it will
  receive props from the emitted object (if any).  Client-side it will
  re-render with updated props whenever `bodyEmitter` fires again.
- `<Sidebar />` will render when `bodyEmitter` has fired at least once _and_
  `sidebarPromise` has resolved.  It will receive props from the _union_ of
  the all objects from `bodyEmitter` and the resolution of `sidebarPromise`.
  Client-side it will re-render with updated props from `bodyEmitter` if it
  fires after the initial render.
- `<TheFold />` will cause an inline `<script>` tag to be sent that kicks off
  the client-side render, making elements above the fold interactive.  This
  forces a browser paint, so it's important to put it after above-the-fold
  elements.
- `<Footer />` Will render immediately, and will be sent to the browser as
  soon as all elements before it have rendered and been sent.  It won't
  receive any props.

## On the server
- Elements are rendered as their promises resolve.
- Elements are sent to the browser when they've been rendered and all elements
  before them have already been sent.
- If an element is blocking already-rendered elements after it, when it
  renders the entire block of elements will be sent in a single `write` to the
  response socket.
- After the above-the-fold elements (followed by `<TheFold/>`)
  have been sent an inline `<script>` is sent that instantiates the
  `ClientController` in the browser and gives it the data bundle for all
  requests that have resolved.  It then renders all elements that have already
  been sent.
- As additional data arrives (if any) it is sent to the browser's bundle in
  inline `<script>` tags.
- After each element _below_ the fold is sent a `<script>` tag is sent
  notifying the `ClientController` that the DOM node for that element is
  ready, and it may be rendered client-side to make it interactive.

## In the browser
- Elements are always rendered in-order.
- The initial render is always the _same_ as the server render.
- Elements may re-render if `listen` emitters fire after the initial render.
