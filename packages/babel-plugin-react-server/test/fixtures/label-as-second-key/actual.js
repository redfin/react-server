var logger = require('react-server')
  .logging
  .getLogger(__LOGGER__({
    custom: 'custom',
    label: 'foo'
  }));
