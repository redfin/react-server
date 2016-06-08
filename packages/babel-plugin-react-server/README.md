# babel-plugin-react-server

React Server transpilation

## Example

**In**

```js
// input code
```

**Out**

```js
"use strict";

// output code
```

## Installation

```sh
$ npm install babel-plugin-react-server
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["react-server"]
}
```

### Via CLI

```sh
$ babel --plugins react-server script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["react-server"]
});
```
