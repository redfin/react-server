var parsedLogs = {};
var dataPoints = [];
var plotLines = [];

var mobileMode = false;
var tabId = -1;

function getCurrentTabUrl(callback) {
	var queryInfo = {
		active: true,
		currentWindow: true,
	};

	chrome.tabs.query(queryInfo, function(tabs) {
		var tab = tabs[0];
		tabId = tab.id;
		callback(tab.url);
	});
}

function renderStatus(message) {
	document.getElementById('status').textContent = message;
}

function getUrlContents(url, callback, errorCallback) {
	var qsChar = (/[?&]/.test(url)) ? '&' : '?';
	var reqUrl = url + qsChar + '_debug_output_logs=true&_=' + new Date().getTime();

	var xhr = new XMLHttpRequest();
	xhr.open('GET', reqUrl);
	xhr.responseType = 'document';

	xhr.onload = function() {
		var response = xhr.response;
		callback(response);
	};

	xhr.onerror = function() {
		errorCallback();
	};

	xhr.send();

	document.getElementById("header").textContent = (mobileMode ? "Mobile" : "Desktop") + " Timeline (react-server)";
}

function parseContents(contents) {
	renderStatus("");

	// contents is an HTML document
	// We know that the react-server timing logs are part of the last script tag
	var scripts = contents.getElementsByTagName('script');
	if (scripts.length === 0) {
		renderStatus("Document does not have any script tags");
	}

	var lastScript = scripts[scripts.length - 1].innerText;
	if (!lastScript.includes('window.reactServerLogs')) {
		renderStatus("Data does not exist");
		return;
	}

	var logs = eval(lastScript);
	generateDataPoints(logs);
	loadHighcharts();
}

var colors = {
	Stores: '#8E7DBD',
	Lifecycle: '#BCDBAD',
	Render: '#A8183C',
};

function reset() {
	renderStatus("Loading....");
	document.getElementById('timeline').innerHTML = "";
	parsedLogs = {};
	dataPoints = [];
	plotLines = [];
}

function loadHighcharts() {
	var categories = [];
	var seriesData = [];
	dataPoints.forEach(function(point, i) {
		categories.push(point.name),
		seriesData.push({
			y: i,
			low: point.startTime,
			high: (point.endTime + 1),
			color: colors[point.name.split('.')[0]],
		});
	});

	var timelineEl = document.getElementById('timeline');
	timelineEl.style.height = Math.max(200, (categories.length * 20)) + 'px';
	timelineEl.style.width = '750px';

	new Highcharts.Chart({
		chart: {
			type: 'columnrange',
			inverted: true,
			renderTo: 'timeline',
		},

		title: {
			text: '',
		},

		xAxis: {
			categories: categories,
		},

		yAxis: {
			title: {
				text: 'Milliseconds',
			},
			plotLines: plotLines,
		},

		tooltip: {
			formatter: function() {
				var s = '<b>' + this.x + '</b>';
				s += '<br />';
				s += this.series.name + ' = ' + (this.point.high - this.point.low) + 'ms';
				return s;
			},
			valueSuffix: 'ms',
		},

		legend: {
			enabled: false,
		},

		series: [{
			name: 'Processing Time',
			borderRadius: 5,
			pointWidth: 10,
			data: seriesData,
		}],
	});
}

function generateDataPoints(logs) {
	parseLogs(logs);
	cleanAndSortParsedLogs();
}

function generatePlotLines(log) {
	if (log[2] == null) {
		return;
	}

	var value = (log[2]+1);

	plotLines.push({
		label: {
			text: log[1] + " (" + value + "ms)",
			rotation: 90,
			verticalAlign: 'top',
			x: 5,
		},
		dashStyle: 'dash',
		color: 'red',
		value: value,
		width: 2,
	});
}

function parseLogs(logs) {
	logs.forEach(function(log) {
		switch (log[1].split('.')[0]) {
			case "Stores":
				parseStoreLogs(log);
				break;
			case "lifecycle":
				parseLifecycleLog(log);
				break;
			case "renderElement":
				parseRenderLog(log);
				break;
			default:
				generatePlotLines(log);
		}
	});
}

function parseStoreLogs(log) {
	var keySplit = log[1].split('.');
	if (keySplit.length !== 4 && keySplit.length !== 5) {
		return;
	}

	var name = (keySplit.length === 4) ? keySplit[3] : keySplit[4];
	var valueKey = (keySplit.length === 4) ? "individual" : "fromStart";

	var keyName = "Stores." + name;
	if (!parsedLogs[keyName]) {
		parsedLogs[keyName] = {};
	}

	parsedLogs[keyName][valueKey] = log[2];
}

function parseLifecycleLog(log) {
	var keySplit = log[1].split('.');
	if (keySplit.length !== 3) {
		return;
	}

	var name = keySplit[2];
	var valueKey = keySplit[1];

	var keyName = "Lifecycle." + name;
	if (!parsedLogs[keyName]) {
		parsedLogs[keyName] = {};
	}

	parsedLogs[keyName][valueKey] = log[2];
}

function cleanAndSortParsedLogs() {
	Object.keys(parsedLogs).forEach(function(key) {
		var data = parsedLogs[key];
		if (data.hasOwnProperty('individual') && data.hasOwnProperty('fromStart')) {
			dataPoints.push({
				name: key,
				startTime: data.fromStart - data.individual,
				endTime: data.fromStart,
			});
		}
	});

	dataPoints.sort((a, b) => {
		if (a.startTime > b.startTime) {
			return 1;
		}
		return -1;
	});
}

function parseRenderLog(log) {
	var keySplit = log[1].split('.');
	if (keySplit.length !== 3) {
		return;
	}

	var name = keySplit[2];
	var valueKey = keySplit[1];

	var keyName = "Render." + name;
	if (!parsedLogs[keyName]) {
		parsedLogs[keyName] = {};
	}

	parsedLogs[keyName][valueKey] = log[2];
}

function onError() {
	renderStatus("Oops!! Sorry there was an error while fetching URL contents");
}

function loadWaterfall(mobile) {
	getCurrentTabUrl(function(url) {
		getUrlContents(url, parseContents, onError, mobile);
	});
}

document.addEventListener('DOMContentLoaded', function() {
	loadWaterfall();

	document.getElementById("mobileMode").addEventListener("click", function() {
		reset();
		mobileMode = true;
		loadWaterfall();
	});

	document.getElementById("desktopMode").addEventListener("click", function() {
		reset();
		mobileMode = false;
		loadWaterfall();
	});
});

chrome.webRequest.onBeforeSendHeaders.addListener(
	function(info) {
		if (!mobileMode) return;
		var headers = info.requestHeaders;
		headers.forEach(function(header) {
			if (header.name.toLowerCase() === "user-agent") {
				header.value = "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1";
			}
		});
		return {requestHeaders: headers};
	}, {
		urls:["http://*/*", "https://*/*"],
		tabId: tabId,
		types: ["xmlhttprequest"],
	},
    ["blocking", "requestHeaders"]
);
