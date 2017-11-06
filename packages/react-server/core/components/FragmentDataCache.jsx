
var ReactServerAgent = require("../ReactServerAgent"),
	React = require('react'),
	PropTypes = require('prop-types');

/**
 * FragmentDataCache writes out a serialized form of the ReactServerAgent request
 * data cache into the `data-react-server-data-cache` attribute of a `<div>`
 * with an id attribute set to the value of the `cacheNodeId` prop. (Defaults
 * to `react-server-fragment-data-cache`)
 *
 * This component should _only_ be used when rendering fragments. Full-page
 * full-page renders have their data cache serialized by `renderMiddleware`.
 *
 * Usage of this component is totally optional. Only use it if you need it.
 *
 * Example (post-fragment-render) :
 *
 * ```javascript
 * var dataCacheStr = document.getElementById('react-server-fragment-data-cache')
 * 			.getAttribute('data-react-server-data-cache');
 *
 * var parsedData = JSON.parse(dataCacheStr);
 *
 * var entry = parsedData.dataCache["/someUrl"];
 * if (entry.err) {
 * 		// there was an error.
 * 		console.log(entry.err.response);	// if 500-error from server: { body: ...JSON... }
 * 		console.log(entry.err.timeout);		// if there was a `.timeout(...)` specified to ReactServerAgent
 *											// that was exceeded
 * } else {
 *		console.log(entry.res); // { body: }
 *
 * ```
 *
 * Known issues:
 * 	* entry.res and entry.err.response won't have any `body` entry if
 *	  the response from the server was HTML instead of JSON.
 */
class FragmentDataCache extends React.Component {

	static get displayName() {
		return 'FragmentDataCache';
	}

	static get propTypes() {
		return {
			cacheNodeId: PropTypes.string,
		};
	}

	static get defaultProps() {
		return {
			cacheNodeId: "react-server-fragment-data-cache",
		};
	}

	/**
	 * Return a promise that resolves with the FragmentDataCache component
	 * when all pending data requests have resolved.
	 */
	static createWhenReady(fragmentDataCacheProps = {}) {
		return ReactServerAgent.cache().whenAllPendingResolve().then(() => {
			return <FragmentDataCache {...fragmentDataCacheProps} />;
		});
	}

	render() {
		return (
			<div
				id={this.props.cacheNodeId}
				data-react-server-data-cache={JSON.stringify(ReactServerAgent.cache().dehydrate({ responseBodyOnly: true }))}>
			</div>
		);
	}
};

module.exports = FragmentDataCache;
