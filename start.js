/**
 * Webpack compilation bootstrap that compiles all of our JS and bundles it with
 * webpack. This allows us to do fancy things to the routes file using RouteHydrationLoader.
 * It also means that things like require.ensure work client-side (if we want them to...)
 */

var cluster = require('cluster'),
	npid = require('npid'),
	path = require('path');


if (cluster.isMaster) {

	setupPidFile();
	setupSignalHandlers();

	var numProcs = parseInt(process.env.CLUSTER, 10);

	if (!numProcs || numProcs === 1) {
		console.log('Starting single process...');
		startServer();
	} else {
		console.log('Starting cluster of ' + numProcs + ' processes...');
		startCluster(numProcs);
	}

} else {
	startServer();
}

function setupPidFile() {
	if (process.env.R3S_PID) {
		var pidFile = path.normalize(process.env.R3S_PID);
		masterLog("Using pid file: " + pidFile);
		try {
			var pid = npid.create(pidFile);
			pid.removeOnExit();
		} catch (e) {
			masterLog(e);
			process.exit(1);
		}
	} else {
		masterLog("R3S_PID not found in env. Not using pid file");
	}
}

function startServer() {
	// loading the module passed in starts the server
	require('./core/server');
}

function startCluster (numProcs) {
	cluster.setupMaster({
		// master process is going to manually hook into child proc stdout/stderr
		// so that we can prepend the process id, so that we can separate out logs
		silent: true
	})

	// when a worker comes online, connect to its stdout and stderr
	// and prepend the process id to the lines it outputs
	cluster.on('online', function (worker) {
		masterLog('worker online: ' + worker.process.pid);
		var proc = worker.process;

		var linePrefix = "[" + proc.pid + "]\t";

		function log (fd, data) {
			var lines = data.toString().split("\n");
			lines.forEach(function (line) {
				if (!line) return;
				console.log(linePrefix + fd + "\t" + line);
			});

		}
		proc.stdout.on('data', log.bind(null, "stdout"));
		proc.stderr.on('data', log.bind(null, "stderr"));

	});

	cluster.on('disconnect', function (worker, code, signal) {
		masterLog(worker.process.pid + ' disconnected. (suicide? ' + worker.suicide + ')');
	});

	// when a worker dies, log the event, and then start up another one to replace it
	// TODO: this will create an infinite loop on startup if startup fails
	cluster.on('exit', function(worker, code, signal) {
		masterLog(worker.process.pid + ' died. (suicide? ' + worker.suicide + ')');
		if (!worker.suicide) {
			// fork another worker process
			cluster.fork();
		}
	});

	for (var i = 0; i < numProcs; i++) {
		cluster.fork();
	}
}

function masterLog(log) {
	console.log("[master]\t" + log);
}

function setupSignalHandlers() {
	// this is sent by the shutdown script
	process.on('SIGTERM', shutdownGracefully);
	// this is fired by Ctrl+C
	process.on('SIGINT', shutdownGracefully);
}

function shutdownGracefully() {
	masterLog("received signal. Shutting Down Gracefully");

	Object.keys(cluster.workers).forEach(function (id) {
		masterLog('Disconnecting ' + cluster.workers[id].process.pid);
		cluster.workers[id].disconnect();
	});

	// give child processes a chance to shut down.
	setTimeout(function () {

		var numRemainingWorkers = getNumWorkers();

		if (numRemainingWorkers === 0) {
			systemExitNextTick();
			return;
		}

		var timeoutSecs = 5;

		masterLog(numRemainingWorkers  + " processes haven't shut down yet. Waiting 5s before kill-ing...");
		setTimeout(function () {

			var numWorkers = 0;
			Object.keys(cluster.workers).forEach(function (id) {
				var worker = cluster.workers[id];
				numWorkers++;
				if (typeof worker.suicide !== 'undefined') {
					// using worker.process.kill because worker.kill() is too nice,
					// and we're just exiting anyway
					masterLog("Killing " + worker.process.pid + " after 5s grace period.");
					worker.process.kill();
				}
			})

			// using process.nextTick to try to give node a chance to
			// flush all the output before exiting. (it appears to cut off
			// a little bit without this)
			systemExitNextTick();


		}, timeoutSecs * 1000);

	}, 1000);
}

function getNumWorkers() {
	var numWorkers = 0;
	Object.keys(cluster.workers).forEach(function () {
		numWorkers += 1;
	});
	return numWorkers;
}

function systemExitNextTick(code) {
	code = typeof code !== 'number' ? 0 : code;
	process.nextTick(function () {
		process.exit(code);
	})
}
