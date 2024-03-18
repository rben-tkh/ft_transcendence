import { useContext, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { SoundContext } from '../../../utils/context/SoundContext';
import { ChatContext } from '../../../utils/context/ChatContext';
import { ProfileContext } from '../../../utils/context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import Warning from '../../Warning';
import { WebSocketContext } from '../../../utils/context/WebSocketContext';
import axios from 'axios';
import Loader from '../../../utils/styles/Loader';
import { GameContext } from '../../../utils/context/GameContext';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 25%;
	border-right: 2px solid dimgrey;
`;

const Banner = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-around;
	align-items: center;
	text-align: center;
	width: 100%;
	border-bottom: 2px solid dimgrey;
	border-radius: 10px 0px 0px 0px;
	background: rgb(35, 35, 35, 0.95);
`

const LoaderContainer = styled.div`
	height: 63%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`

const NavButton = styled.button`
	height: 20%;
	width: 95%;
	margin-top: 0.9vh;
	font-size: 2vh;
	cursor: pointer;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

const TalkList = styled.div`
	display: flex;
	flex-direction: column;
	align-items: start;
	text-align: center;
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
	direction: rtl;
`

const NoConv = styled.p`
	max-width: 90%;
	font-size: 1.5vw;
	font-weight: 600;
	text-align: center;
	margin: auto;
`

const Card = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: end;
	align-items: center;
	text-align: center;
	width: 100%;
	padding: 0.7vh;
	margin-top: 0.8vh;
	font-size: 1vh;
	border-top: 2px solid dimgrey;
	border-bottom: 2px solid dimgrey;
	direction: ltr;
	transition: background-color 150ms ease-in-out;
`;

const Text = styled.p`
	font-size: 2vh;
	margin: 0.2vh;
	font-weight: 500;
`

const CloseButton = styled.button`
	font-size: 1.8vh;
	padding: 0.1vh 0.4vw 0.3vh 0.4vw;
	border: 1px solid dimgrey;
	border-radius: 100%;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const Notif = styled.p`
	width: 50%;
	height: 50%;
	font-size: 1.9vh;
	margin: 0px;
	border: 1px solid dimgrey;
	border-radius: 100%;
	background: rgba(65, 65, 65);
	display: flex;
	justify-content: center;
	align-items: center;
`

const SettingsButton  = styled.button`
	font-size: 1.7vh;
	border-radius: 5px;
	border: 1px solid dimgrey;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const StatusButton = styled.button`
	font-size: 1.5vh;
	border: 1px solid transparent;
	border-radius: 5px;
	background: transparent;
	transition: background-color 150ms ease-in-out;
`

function List(props: { tab: string, setTab: (value: string) => void })
{
	const { socket, headers } = useContext(WebSocketContext);	
	const { setStatus, name, warningType, setWarningType } = useContext(ProfileContext);
	const { namesDisplay, gameInvite, newMessage, talk, setTalk, talkSearched, setTalkSearched, chatList, setChatList, showIdCard, setShowIdCard, showGroupInfo, setShowGroupInfo, listLoading, chatNotif, setChatNotif } = useContext(ChatContext);
	const { setDataGame, setIsAmical } = useContext(GameContext);
	const { handleSFX } = useContext(SoundContext);
	const [ closeIdx, setCloseIdx ] = useState(-1);
	const [ colorIdx, setColorIdx ] = useState(-1);
	const [ userIdx, setUserIdx ] = useState(-1);
	const [ buttonText, setButtonText ] = useState(chatList.map((user) => user.status))
	const [ isHoverNav, setIsHoverNav ] = useState<string | undefined>(undefined);
	const [ isHover, setIsHover ] = useState(false);
	const [ isActive, setIsActive ] = useState(false);
	const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const [ isInvite, setIsInvite ] = useState(-1);
	const [ isDifficulty, setIsDifficulty ] = useState(false);
	const [ inviteForDouble, setInviteForDouble ] = useState(false);
	const navigate = useNavigate();

	const handleBanner = (type: string) => {
		if (props.tab !== type || talk !== undefined)
		{
			props.setTab(type)
			setTalk(undefined);
			handleSFX('clic');
		}
	}
	const handleTalk = (otherTalk?: {pfp: string, name:string, isGroup: boolean, isOwner?: boolean}) => {
		if (talk?.name !== otherTalk?.name)
		{
			if (otherTalk !== undefined)
				setTalk({pfp: otherTalk.pfp, name: otherTalk.name, isGroup: otherTalk.isGroup, isOwner: otherTalk.isOwner});
			setShowIdCard(-1);
			handleSFX('clic');
		}
		else if (showIdCard !== -1 || showGroupInfo)
		{
			chatNotif.set(talk.name, 0);
			setChatNotif(chatNotif);
			setShowIdCard(-1);
			setShowGroupInfo(false);
		}
	}
	const handleClose = async (isGroup: boolean, index: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.stopPropagation();
		if (isGroup)
		{
			setUserIdx(index);
			setWarningType({type: "leave", component: "list"});
			return ;
		}
		if (!isGroup)
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/removeFriendFromChatList`, { roomName:  chatList[index].name}, { headers })
		setTalk(undefined);
		chatList.splice(index, 1);
		setChatList([...chatList]);
		handleSFX('goBack');
	}
	const handleMouseEnter = (index: number, status?: string) => {
		if (status === "Online" && !gameInvite.includes(chatList[index].name))
			setButtonText((prevText) => prevText.map((value, i) => (i === index ? "Invite" : value)));
		setCloseIdx(index)
	}
	const handleMouseLeave = (index: number, status?: string) => {
		setButtonText(chatList.map((user) => user.status))
		setCloseIdx(-1);
		setIsDifficulty(false);
		setIsInvite(-1);
		setButtonText((prevText) => prevText.map((value, i) => (i === index ? status : value)));
	}
	const handleAction = (isGroup: boolean, index: number, event: React.MouseEvent<HTMLButtonElement, MouseEvent>, status?: string) => {
		if (!isGroup && status === "Online" && !gameInvite.includes(chatList[index].name))
		{
			event.stopPropagation();
			setCloseIdx(index);
			setIsInvite(index);
			handleSFX('clic');
		}
	}
	const handleOption = (isDouble: boolean, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.stopPropagation();
		setInviteForDouble(isDouble);
		setIsDifficulty(true);
		handleSFX('clic');
	}
	const handleSpeed = (otherName: string, newSpeed: string, event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		event.stopPropagation();
		handleSFX('header');
		setIsDifficulty(false);
		setIsInvite(-1);
		const speed = newSpeed === "Easy" ? 1 : newSpeed === "Medium" ? 1.5 : 2;
		setIsAmical(true);
		newMessage('game', `${name} ${otherName} ${inviteForDouble ? "Double" : "Simple"} ${newSpeed} Pending`, otherName);
		setDataGame({mode: "Online", isDouble: inviteForDouble, speed: speed, opponent: otherName});
		setStatus("In Matchmaking");
		socket.emit('gameInvite', name, otherName);
		socket.emit('gameMode', `${name} ${otherName}`, speed, inviteForDouble, name);
		navigate("/game");
	}
	useEffect(() => {
		const index = chatList.findIndex((user) => user.name === talk?.name);
		setButtonText(chatList.map((user, i) => {
			if (i === closeIdx && user.status === "Online" && !gameInvite.includes(user.name))
				return ("Invite");
			else
				return (user.status);
		}));
		setColorIdx(index);
		setCloseIdx(-1);
	}, [chatList])
	useEffect(() => {
		const index = chatList.findIndex((user) => user.name === talk?.name);
		if (talk !== undefined && chatNotif.get(talk.name) > 0)
		{
			chatNotif.set(talk.name, 0);
			setChatNotif(chatNotif);
		}
		if (cardRefs.current && cardRefs.current[index])
		{
			const cardRef = cardRefs.current[index] as HTMLDivElement;
			if (cardRef)
				cardRef.scrollIntoView({ behavior: "smooth" });
			setTalkSearched(false);
		}
		setColorIdx(index);
	}, [talk, talkSearched]);
	const mouseEnterStyle = {background: isActive ? "dimgrey" : isHover ? "rgb(75, 75, 75)" : "transparent", border: "1px solid dimgrey"};
	return (<Container>
				<Banner>
						<NavButton onMouseEnter={() => setIsHoverNav("join")} onMouseLeave={() => setIsHoverNav(undefined)} onClick={() => handleBanner("join")} style={(talk === undefined && props.tab === "join" && isHoverNav !== "join") ? {background: 'rgb(75, 75, 75)'} : {}}>Join</NavButton>
						<NavButton onMouseEnter={() => setIsHoverNav("create")} onMouseLeave={() => setIsHoverNav(undefined)} onClick={() => handleBanner("create")} style={(talk === undefined && props.tab === "create" && isHoverNav !== "create") ? {background: 'rgb(75, 75, 75)'} : {}}>Create</NavButton>
						<NavButton onMouseEnter={() => setIsHoverNav("search")} onMouseLeave={() => setIsHoverNav(undefined)} onClick={() => handleBanner("search")} style={(talk === undefined && props.tab === "search" && isHoverNav !== "search") ? {background: 'rgb(75, 75, 75)'} : {}}>Search</NavButton>
						<NavButton onMouseEnter={() => setIsHoverNav("add")} onMouseLeave={() => setIsHoverNav(undefined)} onClick={() => handleBanner("add")} style={(talk === undefined && props.tab === "add" && isHoverNav !== "add") ? {marginBottom: "0.9vh", background: 'rgb(75, 75, 75)'} : {marginBottom: "0.9vh"}}>Add</NavButton>
				</Banner>
				{listLoading ? <LoaderContainer><Loader /></LoaderContainer>: <TalkList>
					{!chatList.length && <NoConv style={{direction: "ltr"}}>No private conversations yet.</NoConv>}
					{chatList.map((otherTalk, index) => (
						<Card key={index} ref={(ref) => cardRefs.current[index] = ref} onMouseEnter={() => handleMouseEnter(index, otherTalk.status)} onMouseLeave={() => handleMouseLeave(index, otherTalk.status)} onClick={() => handleTalk(otherTalk)}
						style={{background: closeIdx === index ? 'rgb(50, 50, 50)' : (colorIdx === index && talk !== undefined) ? 'rgb(65, 65, 65)' : 'rgb(30, 30, 30)', marginTop: !index ? "0vh" : "0.8vh", borderTop: !index ? "none" : "2px solid dimgrey"}}>
						{closeIdx === index && isInvite !== -1 && !gameInvite.includes(otherTalk.name) ?
						<>
							<div style={{width: "100%", height: "100%", display: !isDifficulty ? 'flex' : 'none', flexDirection: 'column', textAlign: "center", alignItems: "center"}}>
								<Text style={{margin: "0.545vh"}}>Game Option</Text>
								<div style={{width: "45%", height: "100%", display: 'flex', flexDirection: 'row', justifyContent: "space-evenly"}}>
									<SettingsButton onClick={(event) => handleOption(false, event)}>Simple</SettingsButton>
									<SettingsButton onClick={(event) => handleOption(true, event)}>Double</SettingsButton>
								</div>
							</div>
							<div style={{width: "100%", display: isDifficulty ? 'flex' : 'none', flexDirection: 'column', textAlign: "center", alignItems: "center"}}>
								<Text style={{margin: "0.545vh"}}>Difficulty</Text>
								<div style={{width: "60%", height: "100%", display: 'flex', flexDirection: 'row', justifyContent: "space-evenly"}}>
									<SettingsButton onClick={(event) => handleSpeed(otherTalk.name, "Easy", event)}>Easy</SettingsButton>
									<SettingsButton onClick={(event) => handleSpeed(otherTalk.name, "Medium", event)}>Medium</SettingsButton>
									<SettingsButton onClick={(event) => handleSpeed(otherTalk.name, "Hard", event)}>Hard</SettingsButton>
								</div>
							</div>
						</> :
						<>
							<div style={{height: "100%", width: "20%"}}><img src={otherTalk.pfp} alt="Picture.png" style={{	objectFit: "cover", height: "6vh", width: "100%", border: "1px solid dimgrey", borderRadius: "10px"}}/></div>
							<div style={{width: "50%", display: 'flex', flexDirection: 'column', alignItems: "center", textAlign: 'center', justifyContent: "center"}}>
								<Text>{namesDisplay.length && namesDisplay.some((names) => names.name === otherTalk.name) ? namesDisplay.find((names) => names.name === otherTalk.name).nameDisplay : otherTalk.name}</Text>
								{<StatusButton onMouseEnter={() => setIsHover(true)} onMouseLeave={() => {setIsHover(false); setIsActive(false)}}
									onMouseDown={() => setIsActive(true)} onMouseUp={() => setIsActive(false)}
									onClick={(event) => handleAction(otherTalk.isGroup, index, event, otherTalk.status)}
									style={(!otherTalk.isGroup && otherTalk.status === "Online" && !gameInvite.includes(otherTalk.name) && closeIdx === index) ? mouseEnterStyle : {}}>
									{otherTalk.isGroup ? `${otherTalk.nbUser} / ${otherTalk.capacity}` : buttonText[index]}
								</StatusButton>}
							</div>
							<div style={{height: "100%", width: "17%", display: "flex", alignItems: "center"}}>
								{chatNotif.get(otherTalk.name) > 0 && index !== closeIdx ?
									<Notif style={chatNotif.get(otherTalk.name) > 9 ? {paddingLeft: "0.1vw"} : {}}>{chatNotif.get(otherTalk.name) > 9 ? "9+" : chatNotif.get(otherTalk.name)}</Notif> :
									<CloseButton style={{visibility: index === closeIdx ? 'visible' : 'hidden'}} onClick={(event) => handleClose(otherTalk.isGroup, index, event)}>x</CloseButton>}
							</div>
						</>}
				</Card>))}
				</TalkList>}
				{warningType.type.length > 0 && warningType.component === "list" && <Warning name={name} groupName={chatList[userIdx].name}/>}
			</Container>);
}

export default List;
