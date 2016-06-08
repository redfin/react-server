import loggerSpec from 'react-server-module-tagger';

export default function({types: t }) {
  return {
    visitor: {
      IdentifierExpression(node) {
        const {name} = node;
        console.log(`node ${node}`);
        console.log(`name ${name}`);

        const config = { trim: state.opts.trim };
        const moduleTag = loggerSpec.bind({ config })(this.file.opts.filename, {});

       let tokens;
       if (state.opts.identifiers) {
         tokens = new Set(state.opts.identifiers);
       } else {
         // technically, channel and cache are only reserved words for future use
         // but let's replace them as a gentle reminder (and convenience for
         // forward-facing users)
         tokens = new Set(["__LOGGER__", "__CHANNEL__", "__CACHE__"]);
       }

        if (tokens.has(name)) {
          console.log(`found ${name} replacement token`);
        }
      }
    }
  };
}
