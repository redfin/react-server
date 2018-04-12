export default function (listener) {
	setTimeout(listener.bind(null, { val: 'foo' }), 10);
}
