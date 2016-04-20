import {
	itOnAllRenders,
	startClientBeforeEach,
	startServerBeforeAll,
	stopServerAfterAll,
} from "../../specRuntime/testHelper"
import _ from 'lodash'

describe("A page's root elements", function() {
	var pages = [];
	var seen = {};
	startClientBeforeEach();

	// Verify that we get our attributes set where they need to go.
	_.forEach({
		'RootElement'   : "[data-react-server-root-id]",
		'RootContainer' : "[data-react-server-container]",
	}, (query, root) => {
		_.forEach({
			'id'    : 'foo',
			'class' : 'bar',
			'style' : 'color: red;',
		}, (value, attr) => desc(
			`can have "${attr}" attribute on ${root}`,
			'/attributesOn'+root,
			client => {
				return client
					.isExisting(query)
					.then(exists => expect(exists).toBe(true))
					.getAttribute(query, attr)
					.then(attrValue => expect(attrValue).toBe(value));
			}
		));
	});


	// Single elements of various types.
	// All should resolve to a single `<div>foo</div>`.
	_.forEach({
		"/singleDivNoArray"                 : "div with no array",
		"/singleDivInArray"                 : "div in an array",
		"/singlePromiseNoArray"             : "promise with no array",
		"/singlePromiseInArray"             : "promise in an array",
		"/singleRootElementNoArray"         : "RootElement with no array",
		"/singleRootElementInArray"         : "RootElement in an array",
		"/singleRootContainerNoArray"       : "RootContainer with no array",
		"/singleRootContainerInArray"       : "RootContainer in an array",
		"/singleRootElementInRootContainer" : "RootElement in a RootContainer",
	}, makeSingleDesc('can be a single'));

	// Get props to root elements in various ways.
	_.forEach({
		"/propsFromEmitterRootElement"   : "RootElement listen",
		"/propsFromEmitterRootContainer" : "RootContainer listen",
	}, makeSingleDesc('can get props from'));

	// Some machinery to factor out commonality.
	function desc(txt, url, fn) {
		itOnAllRenders(txt, client => {
			return fn(client.url(url));
		});
		var page = `./pages/${url[0]+url[1].toUpperCase()+url.slice(2)}`;
		if (!seen[page]){
			seen[page] = true;
			pages.push(page);
		}
	};

	// Expect the contents of the first root element to be 'foo'.
	function makeSingleDesc(prefix) {
		return (txt, url) => {
			desc(`${prefix} ${txt}`, url,
				client => {
					// Note that with this selector this just grabs the first root
					// element.  Won't always be index zero, since containers burn slots
					// (but they don't have `data-react-server-root-id`).
					return client
						.isExisting("[data-react-server-root-id]")
						.then(exists => expect(exists).toBe(true))
						.getText("[data-react-server-root-id]")
						.then(text => expect(text).toMatch('foo'));
				}
			);
		}
	}

	startServerBeforeAll(__filename, pages);
	stopServerAfterAll();
})
