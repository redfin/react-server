import loggerSpec from 'react-server-module-tagger';
import path from 'path';
import * as t from "babel-types";

module.exports = function() {
	return {
		visitor: {
			Identifier(p, state) {
				const {node} = p;
				const {name} = node;

				const trim = state.opts.trim;
				const prefix = state.opts.prefix;
				const parent = path.resolve(path.join(process.cwd(), '..')) + path.sep;
				const filePath = this.file.opts.filename.replace(parent, '');

				//TODO: Support labels
				const moduleTag = loggerSpec({ filePath, trim, prefix });

				let tokens;
				if (state.opts.tokens) {
					tokens = new Set(state.opts.tokens);
				} else {
					tokens = new Set(["__LOGGER__", "__CHANNEL__", "__CACHE__"]);
				}

				if (tokens.has(name)) {
					p.replaceWith(convertObjectToObjectExpression(JSON.parse(moduleTag)));
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
