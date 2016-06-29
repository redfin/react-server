import loggerSpec from 'react-server-module-tagger';
import path from 'path';

module.exports = function({types: t }) {
  return {
    visitor: {
      Identifier(p, state) {
        const {node} = p;
        const {name, type} = node;

        const config = { trim: state.opts.trim };
        const parent = path.resolve(path.join(process.cwd(), '..')) + path.sep;
        const fp = this.file.opts.filename.replace(parent, '');
        const file =  { path: fp };
        //TODO: Support labels
        const moduleTag = loggerSpec.bind({ file, config })(fp);

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
      }
    }
  };
}
