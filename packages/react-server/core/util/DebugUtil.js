import RequestLocalStorage from "./RequestLocalStorage";
import forEach from "lodash/forEach";
import map from "lodash/map";
import assign from "lodash/assign";
import pick from "lodash/pick";

const RLS = RequestLocalStorage.getNamespace();

// This module provides methods that expose values from the query string.
//
// So, for example, if you pass `?_debug_render_timeout=1000` then you can
// call `DebugUtil.getRenderTimeout()` and receive `1000`.
//
// Additionally you may call `DebugUtil.getAllDebugValues()` to obtain an
// object with all debug parameters extracted from the query string.
//
const DEBUG_PARAMS = {
	getRenderTimeout : "_debug_render_timeout",
	getOutputLogs    : "_debug_output_logs",
	getLab           : "_debug_lab",
	getJsBelowTheFold: "_debug_js_below_the_fold",
	getSplitJsLoad   : "_debug_split_js_load",
	getLogLevel      : "_react_server_log_level",
	getLogLevelMain  : "_react_server_log_level_main",
	getLogLevelTime  : "_react_server_log_level_time",
	getLogLevelGauge : "_react_server_log_level_gauge",
};

const DebugUtil = {
	setRequest(req) {
		assign(RLS(), pick(req.getQuery(), map(DEBUG_PARAMS, v => v)));
	},
	getAllDebugValues() {
		return assign({}, RLS());
	},
};

// Make the methods.
forEach(DEBUG_PARAMS, (param, method) => DebugUtil[method] = () => RLS()[param]);

export default DebugUtil;
