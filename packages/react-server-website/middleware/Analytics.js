const text = `
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-81160060-1', 'auto');
ga('send', 'pageview');
`.replace(/\s*\n\s*/g, '');

export default class AnalyticsMiddleware {

	// This only gets called after client transitions in the browser.  It's
	// not called for the initial page view (since the title was set by the
	// server).
	getTitle(next) {
		return next().then(title => {
			if (typeof window !== "undefined") {
				const page = location.pathname;
				window.ga('send', 'pageview', { page, title });
			}
			return title;
		});
	}
	getScripts(next) {
		return next().concat({text});
	}
}
