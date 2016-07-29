import DataBundleCache from "react-server-data-bundle-cache";

// Only need to do this once.  We're not passing any configuration, so we'll
// get the default, which is unlimited bundles for unlimited time.  The cache
// is blown away by refresh, or non-client-transition navigation.
DataBundleCache.install();

// We'll preload some bundles.  Don't want to preload anything more than once,
// so we'll keep track of paths we've already hit.  The data bundle cache
// actually already does this, but we can make the noops even cheaper by
// checking externally.
const preloaded = {};

export default class DataBundleCacheManager {
	handleRoute(next) {

		// Each page may have its data bundle cached.
		DataBundleCache.optIn();

		// Always make sure the section entrypoints are preloaded.
		DataBundleCacheManager.preload(['/docs', '/source']);

		return next();
	}

	static preload(urls) {

		// Preload the urls one at a time by making a big promise chain out of
		// the array of URLs that's passed in.
		urls.reduce((chain, url) => chain.then(() => {
			if (preloaded[url]) return;
			preloaded[url] = true;
			return DataBundleCache.preload(url); // eslint-disable-line consistent-return
		}), Promise.resolve());
	}

	static addContents(prefix, res) {

		// Preload all of the data bundles for the pages in a site section.
		DataBundleCacheManager
			.preload(res.contents.reduce((pages, section) => pages.concat(
				section.pages.map(page => prefix + page.path)
			), []));

		// Pass the response along.
		return res;
	}
}
