import styled from 'styled-components';
import buttonStyles from '../styles/button';

const SecondaryButton = styled.button`
	${buttonStyles}
	background: ${props => props.theme.secondaryButtonColor};
	border-bottom: 2px solid ${props => props.theme.secondaryButtonLightColor};
	-webkit-box-shadow: inset 0 -2px ${props => props.theme.secondaryButtonLightColor};
	box-shadow: inset 0 -2px ${props => props.theme.secondaryButtonLightColor};
`;

export default SecondaryButton;
