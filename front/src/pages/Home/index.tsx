import styled from 'styled-components'
import { useEffect, useContext } from 'react';
import { SoundContext } from '../../utils/context/SoundContext'
import { Link } from 'react-router-dom';
import { ProfileContext } from '../../utils/context/ProfileContext';
import { useNavigate } from 'react-router-dom';

const Container = styled.main`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
`

const Title = styled.h1`
	font-size: 7vh;
	font-weight: 300;
	margin: auto;
`;

const SubTitle = styled.p`
	font-size: 3.5vh;
	font-weight: 300;
`;

const StyledLink = styled(Link)`
	font-size: 5vh;
	padding: 5px 20px;
	border: 2px solid rgb(70, 70, 70, 0.9);
	border-radius: 50px;
	background: linear-gradient(0.5turn, rgb(55, 55, 55, 0.95), rgb(30, 30, 30, 0.6));
	&:hover {
		background: linear-gradient(0turn, rgb(55, 55, 55, 0.95), rgb(30, 30, 30, 0.6));
	}
	&:active {
		background: rgb(70, 70, 70, 0.9);
	}
`;

function Home()
{
	const { handleSFX } = useContext(SoundContext);
	const navigate = useNavigate();
	const { logged, status } = useContext(ProfileContext);

	useEffect(() => {
		const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();
		document.title = 'Home - ft_transcendence';
		const contextMenuListener: EventListener = (e) => handleContextMenu(e as unknown as React.MouseEvent);
		document.addEventListener('contextmenu', contextMenuListener);
		return () => document.removeEventListener('contextmenu', contextMenuListener);
	}, []);
	useEffect(() => {
		if (logged && status === "In Game")
			navigate('/game');
	}, [logged, status]);
	return (
		<Container>
			<Title>Join the competition!</Title>
			<SubTitle>ft_transcendence offers a classic, multiplayer gaming experience with a modern twist.<br />
			Challenge your friends in 1v1 Pong duels while chatting with them using our interactive chat system.<br />
			Immerse yourself in the nostalgia of an iconic game while enjoying thrilling competitive moments.<br />
			Join us and let the games begin!</SubTitle>
			<StyledLink to="/game" onClick={() => handleSFX("header")}>Play Now</StyledLink>
		</Container>
	);
}

export default Home;
