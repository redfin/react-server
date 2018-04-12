let _fetch;
export default function (fetch) {
	if (fetch) {
		_fetch = fetch;
	}
	return _fetch;
}
