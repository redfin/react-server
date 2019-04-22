import {Suite} from "benchmark";
import logging from "../logging/client";

const n = 1000;

let enclosedDeferred;

class NoopTransport {
	constructor() {
		this.name = 'noop';
		this.level = 'info';
	}

	log(level, msg, meta, callback) {
		if (meta === n || meta.ms === n) {
			enclosedDeferred.resolve();
		}
		callback(null, true);
	}
}

class NoopTimeTransport extends NoopTransport {
	constructor() {
		super();
		this.level = 'fast';
	}
}

const noTransportLogger   = logging.getLogger({name: "noTransports"});
const noopTransportLogger = logging.getLogger({name: "noopTransport"});

noopTransportLogger.add(NoopTransport)
noopTransportLogger.timeLogger.add(NoopTimeTransport)

function run(logger, method) {
	return function(deferred) {
		enclosedDeferred = deferred;
		for (var i = 1; i <= n; i++) {
			logger[method]("test", i);
		}
	}
}

new Suite()
	.add("info no transports",  run(noTransportLogger,   'info'))
	.add("info noop transport", run(noopTransportLogger, 'info'), { defer: true })
	.add("time no transports",  run(noTransportLogger,   'time'))
	.add("time noop transport", run(noopTransportLogger, 'time'), { defer: true })
	.on('cycle', (v) => console.log(v.target.name + "\t" + v.target.stats.mean)) // eslint-disable-line no-console
	.run();
