import {getCurrentRequestContext} from "react-server";
import fetch from "./fetch";
import {reset, canCache} from "./opt-in";
import lastUrl from "./last-url";

let didListen = 0;
export default function(){
	if (didListen++) return;

	const ctx = getCurrentRequestContext();

	ctx.onNavigateStart(reset);
	ctx.onLoadComplete(() => canCache() || fetch().invalidate(lastUrl()));
}
