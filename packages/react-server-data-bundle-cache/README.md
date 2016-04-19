### React-server data bundle cache

Cache the data for `react-server` pages for blazing fast client transitions.

## Usage

First, install the module:

```bash
npm install --save react-server-data-bundle-cache
```

Then, install the cache:

```javascript
import DataBundleCache from "react-server-data-bundle-cache"

DataBundleCache.install();
```

Then, opt into bundle caching in pages:

```javascript
class MyPage {
    handleRoute() {
        DataBundleCache.optIn();
        ...
    }
    ...
}
```

Then, link to your page with the `bundleData` option:

```javascript
<Link bundleData={true} path="/mypage">My page</Link>
```

If you _really_ want to be slick, preload the bundle:

```javascript
DataBundleCache.preload('/mypage');
```

### Options:

- `ttl`: How long (in milliseconds) a bundle is good for.
- `max`: How many bundles may be kept in the cache.

Pass options as an object to the `install` method:

```javascript
DataBundleCache.install({
    ttl: 10*60*1000, // Ten minutes.
    max: 10,         // Ten bundles.
});

That's it!  Enjoy! :rocket:
