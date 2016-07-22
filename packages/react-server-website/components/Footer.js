import React from 'react';
import './Footer.less';

export default class Footer extends React.Component {
	render() {
		return (
			<footer>
				<p>
					<small>
						<a href="https://www.redfin.com/">Redfin</a> open-source project. &copy;2016 Redfin.
					</small>
				</p>
				<p>
					<small>
						<a href="http://www.apache.org/licenses/LICENSE-2.0">Apache License 2.0</a> Talk with us on <a href="https://react-server.slack.com/">Slack</a>.
					</small>
				</p>
			</footer>
		);
	}
}
