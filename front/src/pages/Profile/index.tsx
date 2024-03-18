import styled from 'styled-components';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { StyledContainer } from '../../utils/styles/Atoms.tsx';
import { SoundContext } from '../../utils/context/SoundContext/';
import Audio from '../../components/Profile/Audio/';
import Friends from '../../components/Profile/Friends/';
import MatchHistory from '../../components/Profile/MatchHistory/';
import LeaderBoard from '../../components/Profile/LeaderBoard/';
import IdCard from '../../components/Profile/User/IdCard/';
import { ProfileContext } from '../../utils/context/ProfileContext/index.tsx';
import Error from '../Error/index.tsx';
import { WebSocketContext } from '../../utils/context/WebSocketContext/index.tsx';
import { ChatContext } from '../../utils/context/ChatContext/index.tsx';
import axios from 'axios';

const NavContainer = styled.div`
	height: 15%;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	align-items: center;
	text-align: center;
	border-bottom: 2px solid dimgrey;
	border-top-right-radius: 10px;
	border-top-left-radius: 10px;
	background: rgb(35, 35, 35, 0.95);
`;

const NavContent = styled.button<{$notifed?: boolean, $isOnIt: boolean}>`
	font-size: ${(props) => props.$isOnIt ? "2.5vh" : "2vh"};
	font-style: ${(props) => props.$notifed ? "italic" : "none"};
	margin: 1vw;
	padding: 1.1vh 1.5vw;
	border: 1px solid rgb(75, 75, 75, 0.9);
	border-radius: 30px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	transition: background-color 200ms ease-in-out, font-size 100ms ease-in-out;
	&:active{background: dimgrey;}
	cursor: pointer;
`;

const Component = styled.div`
	width: 100%;
	height: 84.8%;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
`

function Profile() {
	const [nav, setNav] = useState(0);
	const { token, headers } = useContext(WebSocketContext);
	const { logout } = useContext(ChatContext);
	const { handleSFX } = useContext(SoundContext);
	const { status, logged, name, setShowMatchHistory, profileNotif, setProfileNotif } = useContext(ProfileContext);
	const [ displayFriendCard, setDisplayFriendCard ] = useState(false);
	const navigate = useNavigate();

	const handleClick = (navNb: number) => {
		if (navNb !== nav)
		{
			handleSFX(`clic`);
			setNav(navNb);
			setShowMatchHistory(false);
		}
		else if (navNb === nav && nav === 2 )
		{
			if (displayFriendCard)
			{
				setDisplayFriendCard(false);
				handleSFX(`goBack`);
			}
		}
	}
	useEffect(() => {
		const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();
		document.title = 'Profile - ft_transcendence';
		const contextMenuListener: EventListener = (e) => handleContextMenu(e as unknown as React.MouseEvent);
		document.addEventListener('contextmenu', contextMenuListener);
		return () => document.removeEventListener('contextmenu', contextMenuListener);
	}, []);
	useEffect(() => {
		if (logged && status === "In Game")
			navigate('/game');
		else if (!token || !logged)
			navigate('/');
	}, [logged, status]);
	useEffect(() => {
		if (logout)
			navigate('/');
	}, [logout]);
	const fetchProfileNotif = async () => {
		await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/setProfileNotif`, { username: name, notif: -1}, { headers });
	};
	useEffect(() => {
		if (profileNotif === nav)
		{
			setProfileNotif(-1);
			fetchProfileNotif();
		}
	}, [profileNotif, nav]);
	return (logged ? <StyledContainer>
				<NavContainer>
					<NavContent $notifed={!profileNotif} $isOnIt={nav === 0} onClick={() => handleClick(0)}>ID Card {!profileNotif && "!"}</NavContent>
					<NavContent $isOnIt={nav === 1} onClick={() => handleClick(1)}>Match History</NavContent>
					<NavContent $notifed={profileNotif === 2} $isOnIt={nav === 2} onClick={() => handleClick(2)}>Friends {profileNotif === 2 && "!"}</NavContent>
					<NavContent $isOnIt={nav === 3} onClick={() => handleClick(3)}>LeaderBoard</NavContent>
					<NavContent $isOnIt={nav === 4} onClick={() => handleClick(4)}>Audio</NavContent>
				</NavContainer>
				<Component>
					{nav === 0 && <IdCard username={name} isLocal={true}/>}
					{nav === 1 && <MatchHistory username={name} />}
					{nav === 2 && <Friends displayFriendCard={displayFriendCard} setDisplayFriendCard={setDisplayFriendCard}/>}
					{nav === 3 && <LeaderBoard displayFriendCard={displayFriendCard} setDisplayFriendCard={setDisplayFriendCard}/>}
					{nav === 4 && <Audio />}
				</Component>
			</StyledContainer> : <Error />);
}

export default Profile;
