import fs from "fs";

export default function fileExists(fn) {
	try {
		fs.statSync(fn);
		return true;
	} catch (e) {
		return false;
	}
}
