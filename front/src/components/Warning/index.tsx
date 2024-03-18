import styled from "styled-components";
import { useContext } from "react";
import { SoundContext } from "../../utils/context/SoundContext";
import { ChatContext } from "../../utils/context/ChatContext";
import { ProfileContext } from "../../utils/context/ProfileContext";
import { WebSocketContext } from "../../utils/context/WebSocketContext";
import axios from 'axios';

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 5px;
	z-index: 10;
`;

const Card = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 50%;
	height: 45%;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: rgba(25, 25, 25, 0.95);
	z-index: 11;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	padding: 1vw;
`;

const Title = styled.h3`
	font-size: 3vh;
	margin-bottom: 0.5vh;
`

const Text = styled.p`
	font-size: 2.5vh;
	margin-bottom: 3vh;
	max-width: 80%;
`

const ButtonContainer = styled.div`
	display: flex;
	justify-content: center;
	width: 100%;
`;

const StyledButton = styled.button`
	width: 30%;
	padding: 5px;
	margin: 5px;
	font-size: 2vh;
	border: 1px solid dimgrey;
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

function Warning(props: {name?: string, groupName?: string, isFriendRequest?: boolean})
{
	const { socket, headers } = useContext(WebSocketContext);
	const { name, warningType, setWarningType, friendRequest, setFriendRequest, setBlocked } = useContext(ProfileContext);
	const { handleSFX } = useContext(SoundContext);
	const { handleSVG, talk, setTalk , chatList, setChatList, setRefreshFriends} = useContext(ChatContext);

	const handleClick =  async () => {
		if (warningType.type === "remove")
		{
			await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/removeFriend', { friendName: props.name }, { headers });
			if (setRefreshFriends !== undefined)
				setRefreshFriends(true);
			if (talk?.name === props.name)
				setTalk(undefined);
			setChatList(chatList.filter((chat: {name: string}) => chat.name !== props.name));
			socket.emit('removeFriend', name, props.name);
		}
		else if (warningType.type === "block")
		{
			if (props.isFriendRequest)
			{
				setFriendRequest(friendRequest.filter((friend: {name: string, pfp: string}) => friend.name !== props.name));
				await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateFriendRequest', { friendName: props.name, action: "block" }, { headers });
			}
			else
			{
				await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/blockFriend', { friendName: props.name }, { headers });
				if (setRefreshFriends !== undefined)
					setRefreshFriends(true);
				if (talk?.name === props.name)
					setTalk(undefined);
				setChatList(chatList.filter((chat: {name: string}) => chat.name !== props.name));
				socket.emit('removeFriend', name, props.name);
			}
			const blockedRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getBlocked`, { headers });
			setBlocked(blockedRes.data);
		}
		else if (warningType.type === "leave")
			socket.emit('sayGoodBye', warningType.type, name, props.groupName, "");
		else if (warningType.type === "mute")
		{
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/chat/muteState', { roomName: props.groupName, userName: props.name }, { headers });
			axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getUserData`, { params: { name: props.name}, headers })
			.then((response) => {
				socket.emit('muteState', props.groupName, response.data.pfp, props.name, `${props.name} has been muted by #${name}`);
			}).catch((error) => console.error('Error when muting user:', error));
		}
		else if (warningType.type === "kick" || warningType.type === "ban")
			socket.emit('sayGoodBye', warningType.type, props.name, props.groupName, name);
		handleSFX("clic");
		setWarningType({type: '', component: ''});
	}
	const handleGoBack = () => {
		handleSFX("goBack");
		setWarningType({type: '', component: ''});
	}
	return (<Overlay><Card>
				<img src={handleSVG("warning")} alt="Warning.svg" style={{height: "8vh"}}/>
				{warningType.type === "remove" && <Title>Remove {props.name}?</Title>}
				{warningType.type === "remove" && <Text>Are you sure to permanently remove {props.name} from your friends list?</Text>}
				{warningType.type === "block" && <Title>Block {props.name}?</Title>}
				{warningType.type === "block" && <Text>Are you sure to block {props.name}?<br />Blocking this user will also remove them from your friends list if this is the case.</Text>}
				{warningType.type === "leave" && <Title>Leave {props.groupName}?</Title>}
				{warningType.type === "leave" && <Text>Are you sure to leave {props.groupName}?<br />You will not be able to return to {props.groupName} if it is private and you do not have the password.</Text>}
				{warningType.type === "mute" && <Title>Mute {props.name} in {props.groupName}?</Title>}
				{warningType.type === "mute" && <Text>Are you sure to mute {props.name}<br />By doing this, {props.name} will no longer able to send messages and invitations in {props.groupName}.</Text>}
				{warningType.type === "kick" && <Title>Kick {props.name} from {props.groupName}?</Title>}
				{warningType.type === "kick" && <Text>Are you sure to kick out {props.name} from {props.groupName}?<br />{props.name} can return if {props.groupName} is public or if he has the password.</Text>}
				{warningType.type === "ban" && <Title>Ban {props.name} from {props.groupName}?</Title>}
				{warningType.type === "ban" && <Text>Are you sure to ban {props.name} from {props.groupName}?<br />After being banned, {props.name} will no longer have the opportunity to rejoin.</Text>}
				<ButtonContainer>
					{<StyledButton onClick={handleGoBack}>No</StyledButton>}
					{<StyledButton onClick={handleClick}>Yes</StyledButton>}
				</ButtonContainer>
			</Card></Overlay>);
}

export default Warning;
