import React from 'react';
import {logging} from 'react-server';
import styled, {ThemeProvider} from 'styled-components';

import Banner from './banner';
import CenteredDiv from './centered-div';
import PrimaryButton from './primary-button';
import SecondaryButton from './secondary-button';
import {ladbrokes, oddButTrendy} from './themes';

const logger = logging.getLogger(__LOGGER__);

export default class HelloWorld extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			exclamationCount: 0,
			theme: oddButTrendy
		};

		this.handlePrimaryClick = () => {
			logger.info(`Getting more excited! previously ${this.state.exclamationCount} excitements.`);
			this.setState({
				exclamationCount: this.state.exclamationCount + 1,
				theme: this.state.theme
			});
		};

		this.handleSecondaryClick = () => {
			logger.info(`Changing theme.  Previously ${this.state.theme.name}.`)
			this.setState({
				theme: this.state.theme.name === oddButTrendy.name ? ladbrokes : oddButTrendy,
				exclamationCount: this.state.exclamationCount
			});
		}
	}

	render() {
		return (
			<ThemeProvider theme={this.state.theme.theme}>
				<CenteredDiv>
					<Banner>Hello, World{'!'.repeat(this.state.exclamationCount)}</Banner>
					<PrimaryButton onClick={this.handlePrimaryClick}>Get More Excited!</PrimaryButton>
					<SecondaryButton onClick={this.handleSecondaryClick}>Change Theme</SecondaryButton>
				</CenteredDiv>
			</ThemeProvider>
		);
	}
}
