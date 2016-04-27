import fetch from "./fetch";

export default function preload(url) {
	return fetch()(url);
}
