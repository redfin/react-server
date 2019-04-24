/* eslint-disable react/react-in-jsx-scope */

import "./sass.scss"
import "./sass.sass"

const RedThing = () => <div className="red-thing">This should be red</div>
const BlueThing = () => <div className="blue-thing">This should be blue</div>

export default class SassPage {
	getElements() {
		return (<div>
			<RedThing />
			<BlueThing />
		</div>);
	}
}
