import {
	DEFAULT_TTL,
} from "stratocacher/lib/constants";

// These are the public options.
export const WRAP_OPTS = ['ttl', 'ttr']
export const LRU_OPTS  = ['max']

export const OVERRIDEABLE_OPTS = Object.freeze({
	ttl  : DEFAULT_TTL,
	max  : Infinity,
});

export const CACHE_NAME = 'react-server-data-bundle-cache';

export { DEFAULT_TTL };
