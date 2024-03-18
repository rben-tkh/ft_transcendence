import styled from 'styled-components'

const Container = styled.footer`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	font-size: 17px;
	position: fixed;
	bottom: 0;
`;

const NamesContainer = styled.div`
	display: flex;
	flex-direction: row;
`;

const Title = styled.p`
	font-size: 20px;
	margin: 5px 0px;
`

const StyledLink = styled.a`
	font-size: 15px;
	padding: 5px 15px;
	&:hover{color: darkgrey;}
	transition: color 150ms ease-in-out;
`;

function Footer()
{
	return (<Container>
				<Title>Creators</Title>
				<NamesContainer>
					<StyledLink href="https://profile.intra.42.fr/users/mabid" target="_blank">mabid</StyledLink>
					<StyledLink href="https://profile.intra.42.fr/users/rben-tkh" target="_blank">rben-tkh</StyledLink>
					<StyledLink href="https://profile.intra.42.fr/users/lkurdy" target="_blank">lkurdy</StyledLink>
					<StyledLink href="https://profile.intra.42.fr/users/anrechai" target="_blank">anrechai</StyledLink>
					<StyledLink href="https://profile.intra.42.fr/users/aperis" target="_blank">aperis</StyledLink>
				</NamesContainer>
			</Container>);
}

export default Footer;
