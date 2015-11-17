
var REGEX_KNOWN_PHONE_DEVICE = /Redfin|(Android.+Mobile|Mobile.+Android)|AgentTools|bb\d+|Kindle|Silk|blackberry|iemobile|ip(hone|od)|opera m(ob|in)i|palm(os)?|phone|p(ixi|re)\/|symbian|treo|up\.(browser|link)|windows(ce|phone)|xda|xiino/i;

module.exports = {
	isMobile(ua){
		return !!REGEX_KNOWN_PHONE_DEVICE.test(ua)
	},
}
