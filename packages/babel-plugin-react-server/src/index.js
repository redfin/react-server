import loggerSpec from 'react-server-module-tagger';

export default function({types: t }) {
  return {
    visitor: {
      Identifier(path, state) {
        const {node} = path;
        const {name, type} = node;

        const config = { trim: state.opts.trim };
        const file =  { path: this.file.opts.filename.replace(__dirname, '') }
        const moduleTag = loggerSpec.bind({ file, config })(file.path);

       let tokens;
       if (state.opts.tokens) {
         tokens = new Set(state.opts.token);
       } else {
         // technically, channel and cache are only reserved words for future use
         // but let's replace them as a gentle reminder (and convenience for
         // forward-facing users)
         tokens = new Set(["__LOGGER__", "__CHANNEL__", "__CACHE__"]);
       }

        if (tokens.has(name)) {
          console.log(`found ${name} replacement token`);
          console.log(`replacing with ${moduleTag}`);
          console.log(`${Object.keys(node)}`);
          path.node.name = moduleTag;
        }
      }
    }
  };
}
