*Work In Progress*

There are a million ways to run the `react-server` service in production.  This document is broken into multiple sections to
describe the elements that go into running your react-server application in production.

# Per-Environment Settings

It helps to setup your project with per-environment settings that are appropriate for your application.  In most cases,
 things that are helpful in development are not desired in production.  A beta environment may be a mix of development
 and production settings.  To begin, create a `.reactserverrc` file in the root of your project.  An example of this
 would be
 
```json
{
  "routesFile": "./routes.json",
  "host": "localhost",
  "port": 3000,
  "jsPort": 3001,
  "hot": false,
  "minify": false,
  "longTermCaching": true,
  "logLevel": "debug",
  "env": {
    "development": {
       "hot": true,
       "longTermCaching": false
    },
    "beta": {
       "jsUrl": "/assets/"
    },
    "production": {
       "jsUrl": "/assets/",
       "logLevel": "error",
       "minify": true
    }
  },
  "webpack-config" : "./webpack.config.js"
}
```

Note that the top-level settings are "global" for the entire `react-server` process.  The key settings are: `hot`,
`minify`, `jsUrl`, and `longTermCaching`.  In specific environments, the settings are changed.  For example, when
`NODE_ENV` is set to `development`, then `hot = true` and `longTermCaching = false`.

To activate any of these settings, make a convenience `npm start` script inside your `package.json` file.  The example
below is a snippet of an entire `package.json` file, only showing the relevant script settings.

```json
{
  "scripts": {
    "start": "NODE_ENV=development react-server start",
    "start-beta": "NODE_ENV=beta react-server start",
    "start-prod": "NODE_ENV=production react-server start"
  }
}
  ```
  
This way, on a production instance, you can run `npm start-prod` and have all of the appropriate settings.  This will
simply start the basic, ExpressJS server included with the `react-server` package.  It's not a total solution yet!
Don't worry, we'll get there later in the guide.

If you want to pass per-environment configuration settings to YOUR application (not to the `react-server` module),
that's easy enough!  You can pass an environment variable to `react-server` to tell it where to find these config files.
Following the previous example, you might change the script entries in `package.json` to look like this:

```json
{
  "scripts": {
    "start": "NODE_ENV=development REACT_SERVER_CONFIGS=_configs/development/ react-server start",
    "start-beta": "NODE_ENV=beta REACT_SERVER_CONFIGS=_configs/beta/ react-server start",
    "start-prod": "NODE_ENV=production REACT_SERVER_CONFIGS=_configs/production/ react-server start"
  }
}
```

And then create the following directories in the root of your application:

- `_configs/development/`
- `_configs/beta/`
- `_configs/production/`

Inside each of those directories, add a file called `config.json` and place any global variables you would like passed
into your application.  One example of the file `_configs/production/config.json` might look like this:

```json
{
  "APP_ENV": "production",
  "MY_GLOBAL_VARIABLE": "foo"
}
```

To use these config variables inside your application, just use the `config()` function inside `react-server` and
you're all set!  This works reliably on both server and client sides of the application--fully isomorphic! 
Here's an example:

```javascript1.6
import { config } from 'react-server';
const globalConfig = config();
const isDevEnvironment = globalConfig.APP_ENV !== "production";
```

# HTTP Server
Once you move past development, running `react-server` becomes more of a question of how to best serve HTTP/HTTPS requests
[ExpressJS](http://expressjs.com) is the application server of choice in this case.  Based on the `.reactserverrc` settings
defined previously in this guide, the ExpressJS server is running on the default port 3000.  We likely want to move this
to either 80 or 443 (HTTP or HTTPS) in production to actually serve clients.  

## ExpressJS
Read the ExpressJS guides on running production webservers to gain a better understanding of how all of this works.
Below are some links to get you started:

- [Security Best Practices](http://expressjs.com/en/advanced/best-practice-security.html)
- [Performance Best Practices](http://expressjs.com/en/advanced/best-practice-performance.html)

All done?  Great.  `react-server` should have many of these concepts already in place for your application so you don't
have to think about it.  However, since it's your server, you *do* have to think about it!  Check out the below links
to see how `react-server` uses/integrates with ExpressJS.

- [react-server-cli/src/commands/start.js](https://github.com/redfin/react-server/blob/master/packages/react-server-cli/src/commands/start.js)
- [react-server/core/renderMiddleware.js](https://github.com/redfin/react-server/blob/master/packages/react-server/core/renderMiddleware.js)


## `nginx` Fronting Server

# Static Assets

# Process Managers/Clustering

[http://expressjs.com/en/advanced/pm.html](http://expressjs.com/en/advanced/pm.html)
