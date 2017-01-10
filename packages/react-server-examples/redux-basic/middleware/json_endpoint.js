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
      payload: object
    }));
  }
}

