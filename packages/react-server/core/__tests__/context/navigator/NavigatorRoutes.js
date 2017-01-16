import DumbPage from "./DumbPage";

// This wrapper is taken from the compileClient function that writes the routes_(client|server).js file
const pageWrapper = {
	default: () => {
		return {
			done: (cb) => { cb(DumbPage); },
		};
	},
};

const Routes = {
	"BasicPage": {
		"path": ["/basicPage"],
		"page": pageWrapper,
	},
	"BasicPageCaps": {
		"path": ["/basicPageCaps"],
		"page": pageWrapper,
		"method": "GET", // this should be all caps because the req.getMethod() will return 'get'.
	},
	"PostPage": {
		"path": ["/postPage"],
		"page": pageWrapper,
		"method": "post",
	},
	"GetAndPostPage": {
		"path": ["/getAndPostPage"],
		"page": pageWrapper,
		"method": ["get", "post"],
	},
};

export default Routes;
