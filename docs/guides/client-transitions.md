React-server provides blazing fast server-side render of web pages.  This is
important for landing experience and for web crawlers, but it's only part of
the picture!  The great strength of `react-server` is that the _same code_
runs in the browser.  Once you've loaded a page, you _could_ ask the server to
render the next page for you, but why bother?  Why not just fetch the _data_
for the page and render it yourself?

That's where _client transitions_ come in.  Navigation between `react-server`
pages can be done without ever hitting the server.  It's easy.  Pages don't
need to do anything tricky to make this work.  It's part of the framework!

## The `<Link>` component

How easy is it?

```javascript
const {Link} = require("react-server");

const MyPageLink = () => <Link path="/my-page">My page!</Link>
```

That easy!  The `<Link>` component exported by `react-server` produces `<a>`
tags with click handlers that automatically turn normal navigation into client
transitions.  Middle-clicks, command-clicks, etc, all still behave as
expected, but a normal left-click to navigate becomes a light-weight
transition within the browser.

## The `navigateTo()` function

Want to manage your own `<a>` tags and click handlers?  Want to navigate based
on some other action?

```javascript
const {navigateTo} = require("react-server");

navigateTo("/my-page");
```

This is what the `<Link>` tag does for you on click.

## The _Options_

Just transitioning from page to page in the browser is great, but if you know
a little bit about the _type_ of navigation ahead of time you can make it
_even better_.  Here are some options for improving client transitions.  Each
of these may be passed either as a `prop` on a `<Link>` tag _or_ as a
key/value pair in an `options` object passed as a second argument to the
`navigateTo` function.

### `bundleData`

```javascript
<Link path={path} bundleData={true}>...</Link>

navigateTo(path, {bundleData: true});
```

In order to render the new page in the browser, we first need to fetch the
_data_ for the new page.  When the server renders a page for us it makes
upstream data requests and then transfers the results to the browser in a data
bundle.  When the browser re-renders the page it makes the same requests, but
the data is already pre-loaded so no actual XHRs go out.  When we render a new
page in the _browser_ we need to make all of the upstream requests that the
server would have made for us.  This could be a lot of requests.  Browsers may
not let us make all of the requests in parallel.  Some might get delayed.

But the _server_ already knows how to make those requests, and it knows how to
bundle the results up for us!  So, we can ask the server just for the _data
bundle_ for a page.  Then, when we make our upstream data requests, we find
the results in the bundle and we don't need to fire actual XHRs!

### `reuseDom`

```javascript
<Link path={path} reuseDom={true}>...</Link>

navigateTo(path, {reuseDom: true});
```

This is useful for "single-page app" style navigation, where there may be UI
that's shared between page (for example a tab-set or a sidebar menu).  With
ordinary navigation, and by default with client transitions, the DOM is blown
away and recreated each time you navigate.  With `reuseDom` portions of the
page that are the same as the previous page are _re-used_.  This includes
`React` component state!  This is single page app navigation done _right_.

### `frameback`

```javascript
<Link path={path} frameback={true}>...</Link>

navigateTo(path, {frameback: true});
```

This one addresses a very specific navigation pattern:  A _list_ page that's
_expensive_ to render, which has links to _details_ pages, where the common
navigation is: Forward to a details page, back to the list page, forward to
_another_ details page, ...

What `frameback` does is make the navigation _back_ to the list page instant.
It does this by loading the _details_ page in an iframe that covers the
viewport and simply hiding the iframe on back-navigation.  This _only_ makes
sense to use if the list page is expensive to render!  For example if it has a
large map with many overlays representing the geographic location of items in
the list.

### `reuseFrame`

```javascript
<Link path={path} frameback={true} reuseFrame={true}>...</Link>

navigateTo(path, {frameback: true, reuseFrame: true});
```

This one only affects the behavior of `frameback`.  Ordinarily each new
details page navigated to using `frameback` is loaded _from the server_ in a
new iframe.  With `reuseFrame` navigation to a new details page may perform a
_client transition_ within the frame instead!

When `reuseFrame` is enabled the other client transition options
(`bundleData`, `reuseDom`) are also available for the navigation between
details pages within the frame.
