
var pathToRegex = require('path-to-regexp');

var fs = require('fs');


var keys = [];

// Original, Spring PrintableListingEsiWrapperController @RequestMapping
// 
// 	@RequestMapping(value = {
//		"/{stateCode:[a-zA-Z][a-zA-Z]|Unknown}/**/home/{propertyId:\\d+}",		// no mls id at the end -sra.
//		"/{stateCode:[a-zA-Z][a-zA-Z]|Unknown}/**/home/{propertyId:\\d+}/{mlsId:.*(?<!trackback|pingback)}",		// mls id at the end -sra.
//		"/{stateCode:[a-zA-Z][a-zA-Z]|Unknown}/**/home/{propertyId:\\d+}/{mlsId:.*(?<!trackback|pingback)}/{randomJunk:.*(?<!trackback|pingback)}"		// mls id at the end and more junk after the url (see bug 89035) -sra.
//	})
// 

var MLS_ID_PATTERN_STRING = "([a-zA-Z|-]{0,10}[\\d|-]{3,}[a-zA-Z]{0,2})";

var re = pathToRegex([
	"/:stateCode([a-zA-Z][a-zA-Z]|Unknown)/(.*)?/home/:propertyId(\\d+)",
	// /(?:^\/([a-zA-Z][a-zA-Z]|Unknown)(?:\/(.*))?\/home\/(\d+)\/(.{0,7}$|.*(?!pingback$).{8}$))/i
	/(?:^\/([a-zA-Z][a-zA-Z]|Unknown)(?:\/(.*))?\/home\/(\d+)\/(.{0,7}$|.*(?!(pingback|trackback)$).{8}$))/i
	///(?:^\/([a-zA-Z][a-zA-Z]|Unknown)(?:\/(.*))?\/home\/(\d+)\/(.{0,7}$|.*(?!pingback$)(?!trackback$)(?:(?:(?!pingback$).{8}$)|(?:(?!trackback$).{9}$))))/i
	///(?:^\/([a-zA-Z][a-zA-Z]|Unknown)(?:\/(.*))?\/home\/(\d+)\/(.{0,7}$|.*(?!pingback$)(?!trackback$).{8,9}$))/i
	// /(?:^\/([a-zA-Z][a-zA-Z]|Unknown)(?:\/(.*))?\/home\/(\d+)\/(.{0,7}$|)
], keys);

console.log(re);
console.log(keys);

var file = fs.readFileSync('../../ldp-urls.txt');
var lines = String(file).split("\n");

// make sure we have a "short-code" version of the LDP url to test
lines.push("/xx/home/12345");
lines.push("/IL/Westmont/338-Memory-Ln-60559/unit-4/home/18010538/trackback")

var matching = [];
var notMatching = [];

var line, questIndex, m;
for (var i = 0; i < lines.length; i++) {
	line = lines[i];
	questIndex = line.indexOf('?');
	if (questIndex > -1) {
		line = line.substring(0, questIndex);
	}

	m = re.exec(line);
	if (m) {
		matching.push({ url: line, match: m })
	} else {
		notMatching.push(line);
	}
}

console.log("Not matching: " + notMatching.length);
notMatching.forEach(function (url) {
	console.log(url);
});

console.log("\n\n");

console.log("Matching: " + matching.length);
matching.forEach(function (result) {
	//console.log(result.url);
	console.log(result.match + "");
});
