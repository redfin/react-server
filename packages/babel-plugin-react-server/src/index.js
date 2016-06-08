import loggerSpec from 'react-server-module-tagger';

export default function({types: t }) {
  return {
    visitor: {
      IdentifierExpression(node) {
        const {name} = node;
        console.log(`node ${node}`);
        console.log(`name ${name}`);

        // TODO: get module identifier from config
        const fn = this.file.opts.filename

        // technically, channel and cache are only reserved words for future use
        // but let's replace them as a gentle reminder (and convenience for
        // forward-facing users)
        if (name === "__LOGGER__" || name === "__CHANNEL__" || name === "__CACHE__") {
          console.log('found __LOGGER__ statment');
        } else if (name === "") {
          console.log(`found replacement token ${name}`);
        }
      }
    }
  };
}
