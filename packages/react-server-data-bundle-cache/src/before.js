import lastUrl from "./last-url";
import listen from "./listen";

export default function before([url]) {
	listen();
	lastUrl(url);
	return [url];
}
