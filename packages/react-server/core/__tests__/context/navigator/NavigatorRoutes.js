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
	"GetPage": {
		"path": ["/getPage"],
		"page": pageWrapper,
		"method": "get",
	},
	"HeadPage": {
		"path": ["/headPage"],
		"page": pageWrapper,
		"method": "head",
	},
	"PostPage": {
		"path": ["/postPage"],
		"page": pageWrapper,
		"method": "post",
	},
	"PatchPage": {
		"path": ["/patchPage"],
		"page": pageWrapper,
		"method": "patch",
	},
	"PutPage": {
		"path": ["/putPage"],
		"page": pageWrapper,
		"method": "put",
	},
	"GetPageCaps": {
		"path": ["/getPageCaps"],
		"page": pageWrapper,
		"method": "GET", // this should be all caps because the req.getMethod() will return 'get'.
	},
	"GetAndHeadPage": {
		"path": ["/getAndHeadPage"],
		"page": pageWrapper,
	},
	"GetAndPostPage": {
		"path": ["/getAndPostPage"],
		"page": pageWrapper,
		"method": ["get", "post"],
	},
};

export default Routes;
