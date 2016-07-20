import {ReactServerAgent} from "react-server";

export default function getDocBody(path) {
	return ReactServerAgent
		.get("/api/docs", {path})
		.then(res => res.body);
}
