import './Theme/base.less';

export default class ThemeMiddleware {
	handleRoute(next){

		return next();
	}
}
