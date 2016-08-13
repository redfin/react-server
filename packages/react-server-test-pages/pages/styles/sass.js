import "./sass.scss"

const RedThing = () => <div className="red-thing">This should be red</div>

export default class SassPage {
	getElements() {
		return <RedThing />
	}
}
