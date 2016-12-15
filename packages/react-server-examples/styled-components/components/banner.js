import styled from 'styled-components';

// from the styled-components docs
// https://github.com/styled-components/styled-components/blob/master/docs/api.md
const Banner = styled.h2`
	font-size: 3.5em;
	color: ${props => props.theme.bannerTextColor};
`;

export default Banner;
