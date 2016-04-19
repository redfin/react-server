import _ from "lodash";
import {wrap} from "stratocacher";
import LayerLRU from "stratocacher-layer-lru";
import {CACHE_NAME, WRAP_OPTS, LRU_OPTS, OVERRIDEABLE_OPTS} from "./constants";
import {ReactServerAgent} from "react-server";

function getOpts(opts, keys) {
	return _.pick(_.assign({}, OVERRIDEABLE_OPTS, opts), keys);
}

export default function(opts) {
	const INTERNAL_OPTS = {
		name: CACHE_NAME,
		layers: [ LayerLRU.configure(getOpts(opts, LRU_OPTS)) ],
	}

	ReactServerAgent._fetchDataBundle = wrap(
		_.assign(getOpts(opts, WRAP_OPTS), INTERNAL_OPTS),
		ReactServerAgent._fetchDataBundle
	);
}
