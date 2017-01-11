'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var JsonResponseMiddleware = function () {
	function JsonResponseMiddleware() {
		(0, _classCallCheck3.default)(this, JsonResponseMiddleware);
	}

	(0, _createClass3.default)(JsonResponseMiddleware, [{
		key: 'setConfigValues',
		value: function setConfigValues() {
			return { isRawResponse: true };
		}
	}, {
		key: 'getContentType',
		value: function getContentType() {
			return 'application/json';
		}
	}, {
		key: 'getResponseData',
		value: function getResponseData(next) {
			return next().then(function (data) {
				return (0, _stringify2.default)(data);
			});
		}
	}]);
	return JsonResponseMiddleware;
}();

exports.default = JsonResponseMiddleware;
module.exports = exports['default'];
