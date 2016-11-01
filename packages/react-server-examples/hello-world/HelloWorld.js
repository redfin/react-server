import React from "react"

export default class HelloWorld extends React.Component {
	constructor(props) {
		super(props);
		this.state = {exclamationCount: 0};
		this.increment = () => {
			this.setState({exclamationCount: this.state.exclamationCount + 1});
		}
	}

	render() {
		return (
			<div>
				<h2>Hello, World{"!".repeat(this.state.exclamationCount)}</h2>
				<button onClick={this.increment}>Get More Excited!</button>
			</div>
		);
	}
}
