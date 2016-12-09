import loggerSpec from 'react-server-module-tagger';
import path from 'path';
import * as t from "babel-types";

module.exports = function() {
	return {
		visitor: {
			Identifier(p, state) {
				const {node} = p;
				const {name} = node;
				const tokens = getTokens(state);

				if (tokens.has(name)) {
					const trim = state.opts.trim;
					const prefix = state.opts.prefix;
					const parent = path.resolve(path.join(process.cwd(), '..')) + path.sep;
					const filePath = this.file.opts.filename.replace(parent, '');
					const options = JSON.parse(loggerSpec({ filePath, trim, prefix }));

					p.replaceWith(convertObjectToObjectExpression(options));
				}
			},
			CallExpression(p, state) {
				const {node} = p;
				const {callee} = node;
				const {name} = callee;
				const tokens = getTokens(state);

				if (tokens.has(name)) {
					const trim = state.opts.trim;
					const prefix = state.opts.prefix;
					const parent = path.resolve(path.join(process.cwd(), '..')) + path.sep;
					const filePath = this.file.opts.filename.replace(parent, '');
					const options = JSON.parse(loggerSpec({ filePath, trim, prefix }));

					// We're assuming that the options string will only ever contain a
					// single option, `label`, and that users won't call a tag as a
					// function without providing a label.  It's the only key we support
					// (at least, its the only one documented in the gulp module tagger),
					// but if we ever support more, we'll need to pass the arguments as a
					// string to loggerSpec (probably by using babel-generator to generate
					// the code again from the ast) or change the module tagger to take an
					// options object, rather than a string.
					const arg = node.arguments[0];
					options.label = arg.properties[0].value.value;

					p.replaceWith(convertObjectToObjectExpression(options));
				}
			},
		},
	};
}

function convertObjectToObjectExpression(obj) {
	const properties = [];
	Object.keys(obj).forEach((key) => {
		let literal;
		switch (typeof obj[key]){
			case 'string':
				literal = t.stringLiteral(obj[key]);
				break;
			case 'number':
				literal = t.numericLiteral(obj[key]);
				break;
			case 'object':
				literal = convertObjectToObjectExpression(obj[key]);
				break;
			default:
				throw new Error(`got unexpected objecy property type of ${typeof obj[key]}`);
		}
		properties.push(t.objectProperty(t.identifier(key), literal));
	});
	return t.objectExpression(properties);
}

function getTokens(state) {
	if (state.opts.tokens) {
		return new Set(state.opts.tokens);
	} else {
		return new Set(["__LOGGER__", "__CHANNEL__", "__CACHE__"]);
	}
}
