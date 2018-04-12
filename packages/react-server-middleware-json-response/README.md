# JSON Response middleware for React Server:

Use this middleware to return a JSON-serialized object from a React Server page.

```javascript
import JsonResponseMiddleware from "react-server-middleware-json-response"

export default class DataEndpoint {
    static middleware() {
        return [JsonResponseMiddleware];
    }

    getResponseData() {
        return { result: "OK!" };
    }
}
```
