import loggerSpec from 'react-server-module-tagger';
import path from 'path';

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
					// this strikes me as a dirty, nasty hack.  I think it would be better
					// to parse the object as json and coerce it to an array of
					// ObjectProperties to construct an ObjectExpression
					p.node.name = moduleTag;
				}
			},
		},
	};
}
