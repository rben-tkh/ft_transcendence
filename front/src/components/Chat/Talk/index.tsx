import styled from 'styled-components';
import { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { SoundContext } from '../../../utils/context/SoundContext';
import Warning from '../../Warning';
import GroupInfos from '../GroupInfos';
import IdCard from '../../../components/Profile/User/IdCard';
import { ChatContext } from '../../../utils/context/ChatContext';
import { ProfileContext } from '../../../utils/context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { WebSocketContext } from '../../../utils/context/WebSocketContext';
import Loader from '../../../utils/styles/Loader';
import axios from 'axios';
import NotSupported from "../../../assets/images/chat/fileNotSupported.svg";
import { GameContext } from '../../../utils/context/GameContext';

const Container = styled.div`
	height: 100%;
	width: 75%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
`;

const Banner = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	text-align: center;
	height: 11.5%;
	width: 100%;
	background: rgb(35, 35, 35, 0.95);
`

const BannerContent = styled.div`
	height: 100%;
	width: 15%;
	display: flex;
	justify-content: center;
	align-items: center;
`

const Picture = styled.img<{$isEditing: boolean, $isInvalid: boolean}>`
	object-fit: cover;
	height: 6.5vh;
	width: 4.2vw;
	border: ${(props) => props.$isInvalid ? "1px solid lightgrey" : "1px solid dimgrey"};
	opacity: ${(props) => props.$isEditing && !props.$isInvalid ? "0.3" : "1"};
	cursor: ${(props) => props.$isEditing && !props.$isInvalid ? "pointer" : "default"};;
	border-radius: 10px;
`;

const InputPfp = styled.input`
	position: fixed;
	top: 1.5%;
	left: 42.3%;
	translate: transform(-50%, -50%);
	height: 6.5vh;
	width: 4.2vw;
	opacity: 0;
	border: 1px solid dimgrey;
	z-index: 9;
	border-radius: 10px;
`

const Name = styled.p`
	width: 100%;
	font-size: 2vw;
	font-weight: 500;
	background: none;
	border-radius: 10px;
`

const StyledButton = styled.button`
	height: 50%;
	padding: 0.6vh 0.5vw;
	font-size: 1vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const StyledInput = styled.textarea`
	width: 95%;
	background: transparent;
	border: none;
	text-align: center;
	font-size: 2vh;
	resize: none;
`;

const Chat = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: start;
	align-items: start;
	text-align: start;
	overflow-y: auto;
	overflow-x: hidden;
	height: 100%;
	width: 100%;
	flex: 1;
`

const ChatContent = styled.div<{$isBlocked: boolean, $type: string}>`
	width: ${(props) => props.$type === "game" ? "50%" : ""};
	display: ${(props) => props.$isBlocked ? "none" : "flex"};
	flex-direction: row;
	justify-content: space-around;
	align-items: center;
	align-self: ${(props) => props.$type === "msg" ? "start" : "center"};
	padding: 0.5vh 0.5vw;
	margin: 1vh 1.5vw;
	border: ${(props) => props.$type === "date" ? "1px solid dimgrey" : "2px solid dimgrey"};;
	border-radius: 5px;
	background: rgb(35, 35, 35);
`;

const MessageContent = styled.div`
	display: flex;
	flex-direction: column;
	align-items: start;
	width: auto;
`

const Text = styled.p`
	font-size: 1.2vw;
	overflow-wrap: break-word;
	max-width: 45vw;
	white-space: pre-line;
`

const ButtonInvite = styled.button`
	padding: 0.6vh 0.5vw;
	font-size: 1vw;
	margin-bottom: 0.5vh;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const Component = styled.div`
	width: 100%;
	height: 88.5%;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
`

function Talk()
{
	const { socket, headers } = useContext(WebSocketContext);
	const { handleSFX } = useContext(SoundContext);
	const [ showEditPicture, setShowEditPicture ] = useState<boolean>(false);
	const { nameDisplay, name, setStatus, warningType, setWarningType, blocked, pfp, friendsData } = useContext(ProfileContext);
	const { setDataGame, setIsAmical } = useContext(GameContext);
	const { namesDisplay, setRefreshNotifs, handleSVG, talk, setTalk, showGroupInfo, setShowGroupInfo, showIdCard, setShowIdCard, setChatList, setUserChat, newMessage, chatNotif, setChatNotif, refreshGroupInfo, setRefreshGroupInfo, userChat } = useContext(ChatContext);
	const [ showUserIdCard, setShowUserIdCard] = useState(false);
	const chatRef = useRef<HTMLDivElement>(null);
	const [ msg, setMsg ] = useState('');
	const [ nbLines, setNbLines ] = useState<number>(0.9);
	const [ nbChar, setNbChar ] = useState<number>(0);
	const navigate = useNavigate();
	const textareaRef = useRef(null);
	const [ groupInfo, setGroupInfo ] = useState<{nbUsers: number, capacity: number, description: string, muted: string[]}>({nbUsers: 0, capacity: 0, description: "", muted: []});
	const [ isEditing, setIsEditing ] = useState<boolean>(false);
	const [ loading, setLoading ] = useState<string>("talkLoading");
	const [ invalidFile, setInvalidFile ] = useState<boolean>(false);
	const [ muted, setMuted ] = useState<boolean>(false);
	const goodName = useMemo(() => {
		if (namesDisplay.length && namesDisplay.some((names) => names.name === talk!.name))
			return (namesDisplay.find((names) => names.name === talk!.name).nameDisplay);
		return (talk!.name);
	})

	const handleGoBack = () => {
		if (talk?.isGroup && showGroupInfo && showIdCard < 0)
		{
			chatNotif.set(talk.name, 0);
			setChatNotif(chatNotif);
			setShowGroupInfo(false);
		}
		else if (talk?.isGroup && showGroupInfo)
			setShowIdCard(-1);
		else
			setTalk(undefined);
		handleSFX('goBack');
	}
	const handleFileChange = async (event : ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0])
		{
			const file = event.target.files[0];
			const formData = new FormData();
			if (!file.type.startsWith('image/'))
			{
				handleSFX("goBack");
				setInvalidFile(true);
				setTimeout(() => setInvalidFile(false), 3000);
				return ;
			}
			formData.append('file', file);
			formData.append('name', talk!.name);
			try {
				const response = await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/edit', formData, { headers });
				setIsEditing(true);
				setTalk((prevState) => ({...prevState, pfp: response.data.pfp}));
				setChatList((prevState) => prevState.map((chat) => chat.name === talk!.name ? { ...chat, pfp: response.data.pfp } : chat));
				handleSFX("clic");
			} catch (error) {
				handleSFX("goBack");
				setInvalidFile(true);
				setTimeout(() => setInvalidFile(false), 3000);
				console.error('Erreur lors de l\'upload', error);
			}
		}
	}
	const handleDisplayWarning = (value: string) => {
		setWarningType({type: value, component: "talk"});
		handleSFX('clic');
	}
	const handleShowInfo = () => {
		if (talk?.isGroup && !showGroupInfo)
		{
			setLoading("infosLoading");
			setShowGroupInfo(true);
		}
		else if (talk?.isGroup)
			setShowIdCard(-1);
		else
			setShowUserIdCard(!showUserIdCard);
		handleSFX('clic');
	}
	const handleInvitation = (action: string, gameInfo: string) => {
		const [otherName, myName, isDouble, speed] = gameInfo.split(' ');
		const goodSpeed = speed === "Easy" ? 1 : speed === "Medium" ? 1.5 : 2;
		if (action === "decline")
		{
			console.log("Decline", friendsData);
			socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
			socket.emit('updateInvite', otherName, otherName, "Declined", name);
			setRefreshGroupInfo(true);
		}
		else if (action === "accept")
		{
			setIsAmical(true);
			setDataGame({mode: "Online", isDouble: isDouble === "Double" ? true : false, speed: goodSpeed, opponent: otherName});
			setStatus("In Matchmaking");
			socket.emit('gameMode', `${otherName} ${myName}`, goodSpeed, isDouble === "Double" ? true : false, name);
			handleSFX('header');
			navigate("/game");
		}
	}
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter')
		{
			e.preventDefault();
			if (msg.trim().length > 0)
			{
				newMessage("msg", msg, talk!.name);
				setMsg('');
				setNbLines(1);
				handleSFX('newMsg');
			}
		}
	};
	const scrollToBottom = () => {
		if (chatRef.current)
			chatRef.current.scrollTop = chatRef.current.scrollHeight;
	};
	const getGroupInfo = async () => {
		try
		{
			const response = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + "/user/get-groupInfo", { params: { roomName: talk!.name }, headers })
			if (response.data)
			{
				setGroupInfo(response.data);
				setMuted(response.data.muted.includes(name));
				const updatedUserChat = response.data.msgs.reduce((acc: { type: string, time: string, userPfp: string, username: string, msg: string, groupName: string }[], message: { type: string, time: string, userPfp: string, username: string, msg: string, groupName: string }) => {
					if (acc.length > 0 && message.type === "msg" && acc[acc.length - 1].type === "msg" && message.username === acc[acc.length - 1].username && message.time === acc[acc.length - 1].time)
						acc[acc.length - 1].msg += "\n" + message.msg;
					else
						acc.push(message);
					return (acc);
				}, []);
				setUserChat(updatedUserChat);
				setLoading("talkLoaded");
			}
		}
		catch (error) {
			console.error(error);
		}
	};
	useEffect(() => {
		if (refreshGroupInfo)
		{
			getGroupInfo();
			setRefreshGroupInfo(false);
		}
	}, [refreshGroupInfo]);
	useEffect(() => {
		if (!isEditing)
		{
			if (talk !== undefined)
			{
				getGroupInfo();
				scrollToBottom();
				setMsg('');
				setNbLines(1);
				setRefreshNotifs(true);
			}
			setShowUserIdCard(false);
			setShowGroupInfo(false);
		}
		setIsEditing(false);
	}, [talk]);
	useEffect(() => {
		if (isEditing)
		{
			socket.emit('roomNameUpdated', talk!.name, groupInfo.name, groupInfo.capacity, groupInfo.description);
			setTalk((prevState) => ({...prevState, name: groupInfo.name}));
			setChatList((prevState) => prevState.map((chat) => chat.name === talk!.name ? { ...chat, name: groupInfo.name, capacity: groupInfo.capacity, description: groupInfo.description } : chat));
		}
	}, [groupInfo]);
	useEffect(() => {
		scrollToBottom();
	}, [showGroupInfo, showUserIdCard, userChat]);
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea && msg.length)
		{
			const numberOfLines = (textarea.scrollHeight / textarea.clientHeight);
			if ((textarea.scrollHeight / textarea.clientHeight) !== 1 || msg.length < nbChar)
			{
				setNbLines(Math.ceil(numberOfLines));
				setNbChar(msg.length);
			}
		}
	}, [msg]);
	return (loading === "talkLoading" ? <Container><Loader/></Container> : <Container>
				{loading !== "infosLoading" && <Banner style={{borderBottom: showGroupInfo && showIdCard < 0 ? 'none' : '2px solid dimgrey'}}>
					<BannerContent>
						<StyledButton onClick={handleGoBack}>Go Back</StyledButton>
					</BannerContent>
					<BannerContent style={{position: "relative"}}>
						{!invalidFile && talk?.isOwner === true && showGroupInfo && <InputPfp type="file" onChange={handleFileChange} onMouseEnter={() => setShowEditPicture(true)} onMouseLeave={() => setShowEditPicture(false)} />}
						<Picture $isEditing={talk?.isOwner === true && showGroupInfo && showEditPicture} $isInvalid={invalidFile} src={invalidFile ? NotSupported : talk!.pfp} alt="Picture.png"/>
						{talk?.isOwner === true && showGroupInfo && showEditPicture && !invalidFile && <img style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", height: "2vh", cursor: 'pointer' }} src={handleSVG("edit")} alt='Edit.svg'/>}
					</BannerContent>
					<BannerContent style={{width: "35%", marginLeft: "-2vw"}}>
						<Name>{namesDisplay.length && namesDisplay.some((names) => names.name === talk!.name) ? namesDisplay.find((names) => names.name === talk!.name).nameDisplay : talk!.name}</Name>
					</BannerContent>
					<BannerContent>
						{!showGroupInfo && <StyledButton onClick={handleShowInfo}>{showUserIdCard ? "Hide" : "Show"} {talk?.isGroup ? "Infos" : "ID Card"}</StyledButton>}
						{talk?.isGroup && showGroupInfo && <Text style={{fontSize: "1.7vw"}}>{groupInfo.nbUsers} / {groupInfo.capacity}</Text>}
					</BannerContent>
					<BannerContent style={{flexDirection: 'column'}}>
						{!talk?.isGroup && <StyledButton style={{margin: "0.5vh", width: "55%"}} onClick={() => handleDisplayWarning("remove")}>Remove</StyledButton>}
						{!talk?.isGroup && <StyledButton style={{marginBottom: "0.5vh", width: "55%"}} onClick={() => handleDisplayWarning("block")}>Block</StyledButton>}
						{talk?.isGroup && <StyledButton onClick={() => handleDisplayWarning("leave")}>Leave</StyledButton>}
					</BannerContent>
				</Banner>}
				{warningType.type.length > 0 && warningType.component === "talk" && <Warning name={talk!.name} groupName={talk!.name}/>}
				{showGroupInfo && <GroupInfos group={groupInfo} setGroupInfo={setGroupInfo} setEditing={setIsEditing} loading={loading} setLoading={setLoading}/>}
				{showUserIdCard && <Component><IdCard username={talk!.name} isLocal={false}/></Component>}
				{!showUserIdCard && !showGroupInfo && <Chat ref={chatRef}>
					{userChat.map((chat, index) =>
						chat.type === "game" ?
						<ChatContent $isBlocked={blocked.includes(chat.username)} $type={chat.type} key={index} style={{marginTop: !index ? "1vh" : "0vh"}}>
							<div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
								<img src={chat.userPfp} alt="Picture.png" style={{objectFit: "cover", width: "90%", height: "5.5vh", borderRadius: "10px", border: "1px solid dimgrey"}}/>
								{chat.type === "game" && <Text style={{margin: "0.5vh", marginTop: "1vh", fontSize: "1.1vw"}}>{chat.username === name ? nameDisplay : goodName}</Text>}
							</div>
							<MessageContent style={{alignItems: "center", width: "50%"}}>
								<Text style={{margin: "auto", marginBottom: "0.5vh", fontSize: "1.4vw"}}>{"Challenge Issued!"}</Text>
								<div style={{display: "flex", flexDirection: "column", justifyContent: "center", marginBottom: "0.8vh"}}>
									<Text style={{margin: 'auto', fontSize: "1.2vw"}}>Game Option: <span style={{fontSize: "1.1vw"}}>{chat.msg.split(' ')[2]}</span></Text>
									<Text style={{margin: 'auto', fontSize: "1.2vw"}}>Difficulty: <span style={{fontSize: "1.1vw"}}>{chat.msg.split(' ')[3]}</span></Text>
								</div>
								<div style={{width: "100%", display: "flex", flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", textAlign: "center"}}>
									{chat.msg.split(' ')[4] === "Pending" ?
									<>
										<ButtonInvite onClick={() => handleInvitation("decline", chat.msg)}>Decline</ButtonInvite>
										<ButtonInvite onClick={() => handleInvitation("accept", chat.msg)}>Accept</ButtonInvite>
									</> :
									<Text style={{margin: "0px", marginBottom: "0.5vh", fontSize: "1.5vw"}}>{chat.msg.split(' ')[4]}</Text>}
								</div>
							</MessageContent>
							<div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
								<img src={chat.username === name ? talk!.pfp: pfp} alt="Picture.png" style={{objectFit: "cover", width: "90%", height: "5.5vh", borderRadius: "10px", border: "1px solid dimgrey"}}/>
								<Text style={{margin: "0.5vh", marginTop: "1vh", fontSize: "1.1vw"}}>{chat.username === name ? goodName : nameDisplay}</Text>
							</div>
						</ChatContent> :
						<ChatContent key={index} $isBlocked={blocked.includes(chat.username)} $type={chat.type} style={{marginTop: !index ? "1vh" : "0vh"}}>
							{chat.type !== "date" &&
							<div style={{height: "100%", width: "auto"}}>
								<img src={chat.userPfp} alt="Picture.png" style={{alignSelf: "start", border: "1px solid dimgrey", objectFit: "cover", borderRadius: "10px", width: "75%", height: chat.type === "msg" ? "4vh" : "4.8vh", margin: "0.5vw"}}/>
							</div>}
							<MessageContent>
								{chat.type === "msg" && <Text style={{margin: "0vh", fontSize: "1.1vw"}}>{chat.username === name ? nameDisplay : talk!.isGroup ? chat.username : goodName} <span style={{fontSize: "0.8vw", marginLeft: "0.3vw"}}>{chat.time}</span></Text>}
								<Text style={{margin: "0vh", fontSize: chat.type === "msg" ? "" : "1.2vw"}}>{chat.msg}</Text>
							</MessageContent>
							</ChatContent>)}
				</Chat>}
				{!showUserIdCard && !showGroupInfo && !muted &&
				<div style={{display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", height: "7.5%", borderTop: "2px solid dimgrey", background: "rgb(35, 35, 35, 0.95)"}}>
					<StyledInput style={{height: nbLines > 1 ? "95%" : "50%"}} ref={textareaRef} type="text" rows={nbLines} name="msg" autoComplete="off" placeholder={`Send a message to ${talk?.name}`} maxLength={120} value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={handleKeyDown} autoFocus/>
				</div>}
			</Container>);
}

export default Talk;
