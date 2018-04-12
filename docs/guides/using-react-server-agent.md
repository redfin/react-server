# Using ReactServerAgent:

ReactServerAgent is used to handle data requests with React Server.  It has
methods for requests using the most common
[http methods](https://en.wikipedia.org/wiki/Hypertext_Transfer_Protocol#Request_methods).
Under the covers, ReactServerAgent uses [SuperAgent](https://github.com/visionmedia/superagent) to handle its requests and
responses, so much of the api will be familiar to users of SuperAgent.  If you
see an error from ReactServerAgent that says "$Method from superagent's API isn't implemented yet", please [submit an issue](https://github.com/redfin/react-server/issues/new) requesting it.


# Extending SuperAgent:

ReactServerAgent provides two points at which to extend SuperAgent: `plugRequest`
and `plugResponse`.  These methods are called to modify the request or response
object before the request is triggered, or before the resonse is passed to the
callers callback.  See the api docs for more details.


# How do I find out more?

The best place to learn more about how to write middleware is by looking at
[core/ReactServerAgent.js](http://redfin.github.io/react-server/annotated-src/ReactServerAgent).
You might also check out the other parts of ReactServerAgent:
- [core/ReactServerAgent/Cache.js](http://redfin.github.io/react-server/annotated-src/Cache)
- [core/ReactServerAgent/Plugins.js](http://redfin.github.io/react-server/annotated-src/Plugins)
- [core/ReactServerAgent/Request.js](http://redfin.github.io/react-server/annotated-src/Request)
- [core/ReactServerAgent/util.js](http://redfin.github.io/react-server/annotated-src/util)
