// ANSI escape sequence on the server.
// CSS rgb(...) color in the browser.
var makeColor = function(r,g,b){
	return {
		server: 16 + r*36 + g*6 + b,
		client: "rgb("+[
				(r*42.5)|0,
				(g*42.5)|0,
				(b*42.5)|0,
			].join(',')+")",
	}
}

// This produces a list of 24 colors that are distant enough from each
// other to be visually distinct.  It's also, conveniently, the same
// palette client side and server side.
var colors = [];
for (var r = 1; r < 6; r+=2)
	for (var g = 1; g < 6; g+=2)
		for (var b = 1; b < 6; b+=2)
			if (r != g || g != b) // No gray.
				colors.push(makeColor(r,g,b));

// Just want a fairly well distributed deterministic mapping.
//
// Adapted from:
// http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
var colorForString = function(str){
	var hash = 0, i, chr, len;
	if (str.length == 0) return hash;
	for (i = 0, len = str.length; i < len; i++) {
		chr   = str.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}

	len = colors.length;

	// Positive mod.
	return colors[(hash%len+len)%len];
}

module.exports = colorForString;