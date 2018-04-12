import reactServer from "./react-server";

export default function setupLogging({ logLevel, timingLogLevel, gaugeLogLevel }) {
	reactServer.logging.setLevel("main", logLevel);
	reactServer.logging.setLevel("time", timingLogLevel);
	reactServer.logging.setLevel("gauge", gaugeLogLevel);
}
