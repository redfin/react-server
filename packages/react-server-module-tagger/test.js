import test from 'ava';
import loggerSpec from '.';

test('creates a module tag', t => {
	const expected = '{\"name\":\"foo.bar\",\"color\":{\"server\":73,\"client\":\"rgb(42,127,127)\"}}';

	const filePath = 'foo/bar';
	const actual = loggerSpec({filePath});

	t.is(expected, actual);
});

test('trims prefix from module tag name', t => {
	const expected = '{\"name\":\"quux\",\"color\":{\"server\":229,\"client\":\"rgb(212,212,127)\"}}';

	const filePath = 'baz/quux';
	const trim = 'baz.';
	const actual = loggerSpec({filePath, trim});

	t.is(expected, actual);
});

test('adds prefix to module tag name', t => {
	const expected = '{\"name\":\"foo.bar.baz\",\"color\":{\"server\":131,\"client\":\"rgb(127,42,42)\"}}';

	const filePath = 'bar/baz';
	const prefix = 'foo.';
	const actual = loggerSpec({filePath, prefix});

	t.is(expected, actual);
});

test('adds labels', t => {
	const expected = '{\"label\":\"foo\",\"name\":\"has.label.foo\",\"color\":{\"server\":131,\"client\":\"rgb(127,42,42)\"}}';

	const filePath = 'has/label';
	const opts = {label: "foo"};
	const actual = loggerSpec({filePath, opts});

	t.is(expected, actual);
});
