# react-server-module-tagger

A function for tagging [react-server](https://www.npmjs.com/package/react-server)
logger instances with information about the module they're being used in.

To transpile your source for use with
[React Server](https://www.npmjs.com/package/react-server), install gulp and the plugin

```shell
npm i -D gulp react-server-module-tagger
```

Then require and call the function.  The tagger expects to have config and file
data on its prototype, so use `.bind`.

```javascript
const tagger = require('react-server-module-tagger');
const filepath = 'path/to/my/output.js';
const moduleTag = tagger.bind({ file: { path: filepath }, config: { trim: 'path/to'} })(filepath));
```

returns a logger instance that will have consistent coloring on the server and
the client, and that has a human-friendly, readable name that easily maps to
the file tree (in this example `components.my-feature.foo`).
