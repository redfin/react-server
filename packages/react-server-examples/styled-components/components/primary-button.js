import styled from 'styled-components';
import buttonStyles from '../styles/button';

// credit to http://cssdeck.com/labs/beautiful-flat-buttons
const PrimaryButton = styled.button`
	${buttonStyles}
	background: ${props => props.theme.primaryButtonColor};
	border-bottom: 2px solid ${props => props.theme.primaryButtonLightColor};
	-webkit-box-shadow: inset 0 -2px ${props => props.theme.primaryButtonLightColor};
	box-shadow: inset 0 -2px ${props => props.theme.primaryButtonLightColor};
`;

export default PrimaryButton;
