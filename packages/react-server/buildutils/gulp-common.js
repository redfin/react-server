var babel = require("gulp-babel");

module.exports = {
	es6Transform: function() {
		// stage:1 needed since es7.objectRestSpread is a stage 1 ES7 proposal
		return babel(require("./babel-opts"));
	},
}
