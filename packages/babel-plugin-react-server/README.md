# babel-plugin-react-server

React Server transpilation

## Example:

**In**

```js
var logger = require('react-server').logging.getLogger(__LOGGER__);
```

**Out**

```js
"use strict";

var logger = require('react-server').logging.getLogger({ name: 'module.name', color: {} });
```

## Installation:

```sh
$ npm install babel-plugin-react-server
```

## Usage:

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["react-server"]
}
```

### Via CLI:

```sh
$ babel --plugins react-server script.js
```

### Via Node API:

```javascript
require("babel-core").transform("code", {
  plugins: ["react-server"]
});
```


## Configuration:

A fully configured babel plugin in your babelrc would look be

```json
{
  "plugins": [
    ["react-server", {
      "trim": "my-project.components.",
      "token": "__LOGGER__"
    }]
  ]
}
```


### Trim:

A substring to trim off the front of the module name

```javascript
{
    trim: "my-project.pages."
}
```

### Token:

The token to replace in the source code with the module tag.  By default, uses
the default logger token `__LOGGER__`, and two future reserved tokens,
`__CHANNEL__` and

```javascript
{
    token: "__LOGGER__"
}
```
