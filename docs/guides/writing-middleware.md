# What is a middleware?

Middleware are plugins that allow for some transformation of the request or
response object while react-server is processing the request and response.
First, the request object is passed down through each middleware in the
middleware stack in turn, calling `next()` to indicate that they are done with
the request object and ready to yield control down the chain.  At some point,
one of the middlewares may decide that it should respond to the request, and a
request object is created.  This request object is passed through each of the
middlewares on the way back up, who each may mutate the response object in
some way.

An example use case for a middleware might be for a user verification system.
The user middleware is invoked as part of the middleware chain with the
request object, retrieves the jwt from the request, and makes an asynchronous
request to a jwt verifier that returns a promise before calling `next()`.
Then, after the rest of the middleware have been called, and control has been
yielded back up to the user authentication verification middleware with the
response object, the middleware can check the promise from the verifier to
ensure the user has a valid jwt.  If the user does not, the middleware can
change the response to be a 403 forbidden.


# What does a react-server middleware look like?

Here's a simple react-server middleware that only sets the ContentType header
to application/json for json responses.

```js
export default class JsonEndpoint {
	setConfigValues() {
		return { isRawResponse: true };
	}

	handleRoute(next) {
		return next();
	}

	getContentType() {
		return 'application/json';
	}

	getResponseData(next) {
		return next().then(object => JSON.stringify({
			payload: object,
			resultCode: 0,
		}));
	}
}
```


# How do I find out more?

The best place to learn more about how to write middleware is by looking at
[core/util/PageUtil.js](http://redfin.github.io/react-server/annotated-src/PageUtil).
