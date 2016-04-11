import parseCliArgs from "./parseCliArgs"
import {start} from "."

const argv = parseCliArgs();

start(argv.routes, argv);
