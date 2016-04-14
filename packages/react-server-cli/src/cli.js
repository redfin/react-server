import parseCliArgs from "./parseCliArgs"
import fs from "fs"

import {start} from "."

const argv = parseCliArgs();

if (argv.httpsKey || argv.httpsCert || argv.httpsCa || argv.httpsPfx || argv.httpsPassphrase) {
	argv.https = {
		key: argv.httpsKey ? fs.readFileSync(argv.httpsKey) : undefined,
		cert: argv.httpsCert ? fs.readFileSync(argv.httpsCert) : undefined,
		ca: argv.httpsCa ? fs.readFileSync(argv.httpsCa) : undefined,
		pfx: argv.httpsPfx ? fs.readFileSync(argv.httpsPfx) : undefined,
		passphrase: argv.httpsPassphrase,
	}
}

start(argv.routes, argv);
