import test from 'ava';
import loggerSpec from '.';

test(t => {
  const file = 'foo.bar';
  const config = {};
  const expected = '{\"name\":\"foo.bar\",\"color\":{\"server\":73,\"client\":\"rgb(42,127,127)\"}}';

  t.is(expected, loggerSpec.bind({file, config})(file));
});

test(t => {
  const file = 'baz.quux';
  const config = { trim: 'baz.' };
  const expected = '{\"name\":\"quux\",\"color\":{\"server\":135,\"client\":\"rgb(127,42,212)\"}}';

  t.is(expected, loggerSpec.bind({file, config})(file));
});
