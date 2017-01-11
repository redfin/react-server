# react-server-module-tagger

A function for tagging [react-server](https://www.npmjs.com/package/react-server)
logger instances with information about the module they're being used in.

To transpile your source for use with
[React Server](https://www.npmjs.com/package/react-server), install gulp and the plugin

```shell
npm i -D gulp react-server-module-tagger
```

Then require and call the function.

```javascript
const tagger = require('react-server-module-tagger');
const filePath = 'path/to/my/output.js';
const opts = {label:"foo"};
const moduleTag = tagger({ filePath, trim: 'path/to', opts });
```

returns a logger instance that will have consistent coloring on the server and
the client, and that has a human-friendly, readable name that easily maps to
the file tree (in this example `components.my-feature.foo`).
