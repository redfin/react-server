import JsonEndpoint from '../../middleware/json_endpoint';

export default class CounterAPI {
  static middleware() {
    return [JsonEndpoint];
  }

  handleRoute() {
    return {code: 200};
  }

  getResponseData() {
    return Promise.resolve(123);
  }

}
