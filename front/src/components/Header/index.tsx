import { useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import BtnHome from '../../assets/images/header/btn-home.png';
import BtnPlay from '../../assets/images/header/btn-play.png';
import BtnChat from '../../assets/images/header/btn-chat.png';
import BtnChatNotif from '../../assets/images/header/btn-chat-notif.png';
import BtnProfile from '../../assets/images/header/btn-profile.png';
import BtnProfileNotif from '../../assets/images/header/btn-profile-notif.png';
import { GameContext } from '../../utils/context/GameContext/'
import { SoundContext } from '../../utils/context/SoundContext/'
import Pause from '../Game/Pause/'
import { ProfileContext } from '../../utils/context/ProfileContext';
import { ChatContext } from '../../utils/context/ChatContext';
import { WebSocketContext } from '../../utils/context/WebSocketContext';
import PauseButton from '../../assets/images/header/pause-button.png';
import Toast from '../Game/Pause/Toast/';

const Container = styled.header`
	display: flex;
`;

const HomeLogo = styled.img`
	height: 17vh;
`;

const Title = styled.h1`
	display: flex;
	margin: auto;
	margin-right: 0px;
	font-size: 5vw;
	font-weight: 400;
`;

const NavContent = styled.nav`
	display: flex;
	margin: auto;
`;

const StyledLink = styled(Link)<{$isInLocalGame: boolean}>`
	font-size: 2.5vh;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: auto;
	height: 12vh;
	transition: height 150ms ease-in-out;
	&:hover{height: ${(props) => props.$isInLocalGame ? "12.5vh" : "15vh"}};
`;

const NavLogo = styled.img`
	height: 7vh;
	width: auto;
`;

const Text = styled.h2`
	font-size: 3vh;
	margin: 0%;
	font-weight: 500;
`;

function Header()
{
	const location = useLocation();
	const { name, logged, status, setStatus, profileNotif } = useContext(ProfileContext);
	const { setShowMode, dataGame, setDataGame, setScores, pauseAsked, setPauseAsked, setPrevBadges, gamePaused, setGamePaused } = useContext(GameContext);
	const { socket } = useContext(WebSocketContext);
	const { setTalk, chatNotif } = useContext(ChatContext);
	const { handleSFX } = useContext(SoundContext);

	const handleClick = (path: string, sfx: string) => {
		if (location.pathname !== path)
		{
			if (path !== "/chat")
				setTalk(undefined);
			if (path !== "/game")
			{
				if (status !== "In Game")
				{
					if (status === "In Matchmaking" && dataGame.mode === "Online")
					{
						if (dataGame.id === undefined && dataGame.opponent !== undefined)
							socket.emit('updateInvite', name, dataGame.opponent, "Canceled", null);
						socket.emit('cancelQueue');
					}
					setStatus("Online");
					setScores({x: 0, y:0});
					setDataGame({mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
					setPrevBadges([]);
				}
				setShowMode(true);
			}
			else
			{
				setGamePaused(null);
				if (dataGame.mode === "Online")
					socket.emit('endPause', dataGame.id);
			}
			if (status !== "In Game")
				handleSFX(sfx)
		}
	};
	const handleProfileClick = async () => {
		try {
			window.location.href = `${process.env.REACT_APP_URL_LOCAL_BACK}/authentification`;
		} catch (error) {
			console.log(error);
		}
	};
	const handleAskPause = () => {
		if (dataGame.mode === "Online")
			socket.emit('pauseGame', dataGame.id);
		setPauseAsked(true);
		handleSFX("clic");
	};
	useEffect(() => {
		if ((gamePaused && gamePaused !== "leave") || status !== "In Game")
			setPauseAsked(false);
	}, [status, gamePaused]);
	return (
		<Container>
			<Link style={{margin: "auto", cursor: status === "In Game" ? "default" : "pointer"}} to={status === "In Game" ? "/game" : "/"} onClick={() => handleClick("/", "exit")}>
				<HomeLogo src={BtnHome} alt='PongLogo.png' />
			</Link>
			<Title>ft_transcendence</Title>
			<NavContent>
				<StyledLink $isInLocalGame={dataGame.mode === "Local"} style={{visibility: status === "In Game" ? "hidden" : "visible", paddingLeft: "35px"}} to="/game" onClick={() => handleClick("/game", "header")}>
					<NavLogo style={{height: "10vh", width: "5vw", marginTop: "-1.5vh"}} src={BtnPlay} alt='PlayLogo.png'/>
					<Text style={{marginTop: "-1vh"}}>{"Play"}</Text>
				</StyledLink>
				{logged && <StyledLink $isInLocalGame={dataGame.mode === "Local"} style={{visibility: status === "In Game" && pauseAsked ? "hidden" : "visible", paddingLeft: "35px"}} to={status === "In Game" ? "/game" : "/chat"} onClick={status === "In Game" ? handleAskPause : () => handleClick("/chat", "header")}>
					<NavLogo style={{height: "8vh", width: "5vw"}} src={status === "In Game" ? PauseButton : Array.from(chatNotif.values()).some((value: any) => value > 0) ? BtnChatNotif : BtnChat} alt='ChatLogo.png'/>
					<Text>{status === "In Game" ? "Pause" : "Chat"}</Text>
				</StyledLink>}
				<StyledLink $isInLocalGame={dataGame.mode === "Local"} style={{visibility: status === "In Game" ? "hidden" : "visible", paddingLeft: "35px"}} to={logged ? "/profile" : "#"} onClick={logged ? () => handleClick("/profile", "header") : handleProfileClick}>
					<NavLogo style={{marginBottom: "1vh"}} src={profileNotif !== -1 ? BtnProfileNotif : BtnProfile} alt='ProfileLogo.png'/>
					<Text>{logged ? "Profile" : "Log In"}</Text>
				</StyledLink>
			</NavContent>
			{pauseAsked && <Toast />}
			{gamePaused && <Pause />}
		</Container>);
}

export default Header;
