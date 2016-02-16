
const BasicComponent = (props) => <div>Basic Component</div>;

export default class SimpleContainerPage {

	getElements () {
		// not a container
		return [
			<BasicComponent />,
		];
	}

}