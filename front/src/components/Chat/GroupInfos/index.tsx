import styled from "styled-components";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SoundContext } from "../../../utils/context/SoundContext";
import Warning from "../../Warning";
import IdCard from "../../Profile/User/IdCard";
import { ProfileContext } from "../../../utils/context/ProfileContext";
import { WebSocketContext } from "../../../utils/context/WebSocketContext";
import { ChatContext } from "../../../utils/context/ChatContext";
import CreateInfo from "../CreateInfo";
import axios from 'axios';
import Loader from "../../../utils/styles/Loader/";

const Container = styled.div<{$centerInfos: boolean}>`
	display: flex;
	flex-direction: column;
	justify-content: ${(props) => props.$centerInfos ? "center" : "start"};
	align-items: center;
	height: 88.5%;
	width: 100%;
`;

const Content = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	width: 100%;
`

const TextContent = styled.div`
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-self: flex-start;
	border-bottom: 2px solid dimgrey;
	background: rgb(35, 35, 35, 0.95);
`

const Picture = styled.img`
	object-fit: cover;
	height: 6vh;
	width: 75%;
	border: 1px solid dimgrey;
	border-radius: 10px;
`;

const UserContainer = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: space-evenly;
	align-items: center;
	flex-wrap: wrap;
	width: 100%;
	height: 100%;
`

const Card = styled.div`
	height: 17%;
	width: 45%;
	display: flex;
	flex-direction: row;
	align-items: center;
	text-align: center;
	font-size: 1.2vw;
	justify-content: space-evenly;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: rgb(35, 35, 35, 0.95);
`

const Block = styled.div`
	height: 100%;
	width: 20%;
	display: flex;
	align-items: center;
	text-align: center;
	justify-content: center;
`

const StyledButton = styled.button`
	font-size: 0.9vw;
	padding: 0.5vh 0.5vw;
	width: 100%;
	border: 1px solid rgb(60, 60, 60);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const AdminForm = styled.form`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: row;
	align-self: flex-start;
	align-items: center;
	border-bottom: 2px solid dimgrey;
	background: rgb(35, 35, 35, 0.95);
`

const GroupName = styled.input<{$isValid: boolean}>`
	width: 17%;
	margin: auto;
	margin-right: 0%;
	margin-left: 1.9vw;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border-radius: 10px;
	font-size: 1vw;
	text-align: center;
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const PassField = styled.div`
	display: flex;
	justify-content: start;
	align-items: center;
	width: 52%;
	margin: auto;
	margin-right: 0%;
	border-radius: 10px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
`

const Password = styled.input<{$isValid: boolean}>`
	width: 100%;
	font-size: 1vw;
	background: transparent;
	border: none;
	text-align: center;
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const EyePass = styled.img`
	cursor: pointer;
	margin: 0px;
	margin-right: -1px;
	border-top-right-radius: 10px;
	border-bottom-right-radius: 10px;
	background: transparent;
	&:hover{background: rgb(75, 75, 75, 0.5);}
	&:active{background: dimgrey}
`

const Capacity = styled.input<{$isValid: boolean}>`
	width: 13%;
	margin: auto;
	margin-right: 3.3vw;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border: 1px solid dimgrey;
	border-radius: 10px;
	font-size: 1vw;
	text-align: center;
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const Description = styled.input<{$isValid: boolean}>`
	width: 89%;
	margin-top: 1vh;
	margin-right: 1.3vw;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border: 1px solid dimgrey;
	border-radius: 10px;
	font-size: 1vw;
	text-align: center;
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const Confirm = styled.button`
	font-size: 0.9vw;
	padding: 1vh 0.5vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const Role = styled.img`
	height: 2vh;
`

const Text = styled.p`
	font-size: 1.5vw;
	margin: 0.5vh 0.5vw;
	overflow-wrap: break-word;
	max-width: 84%;
`

const Info = styled.button`
	height: 3vh;
	width: 1.6vw;
	margin-left: 1.5vw;
	font-size: 1vw;
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 100%;
	cursor: pointer;
	background: transparent;
	&:hover{background: rgba(255, 255, 255, 0.2);}
	&:active{background: rgba(255, 255, 255, 0.5);}
	transition: background-color 200ms ease-in-out;
`

interface GroupData {
	name: string;
	password: string;
	capacity?: number;
	description: string;
}

function GroupInfos(props: {group: {name: string, capacity: number, description: string, muted: string[]}, setGroupInfo: (value: {pfp: string, name: string, nbUsers: number, capacity: number, description: string}) => void, setEditing: (value: boolean) => void, loading: boolean, setLoading: (value: boolean) => void})
{
	const [ users, setUsers ] = useState<{pfp: string, name: string, nameDisplay: string, role: string, isPending: boolean}[]>([]);
	const [ adminClic, setAdminClic ] = useState<number>(-1);
	const { name, pfp, warningType, setWarningType, friendsData, friendRequest, blocked, setBlocked } = useContext(ProfileContext);
	const { handleSFX } = useContext(SoundContext);
	const { socket, headers } = useContext(WebSocketContext);
	const { showIdCard, setShowIdCard, handleSVG, setTalk, setTalkSearched, chatList, setChatList, refreshGroupInfo, setRefreshFriends } = useContext(ChatContext);
	const [ showPass, setShowPass ] = useState(false);
	const [ userIdx, setUserIdx ] = useState(0);
	const [ formData, setFormData ] = useState<GroupData>({ name: '', password: '', capacity: props.group.capacity, description: ''});
	const [ formHolder, setFormHolder ] = useState<GroupData>({name: props.group.name, password: 'New Password', capacity: props.group.capacity.toString(), description: props.group.description});
	const [ isValid, setIsValid ] = useState({ name: true, password: true, capacity: true, description: true});
	const [ isEdit, setIsEdit ] = useState(false);
	const [ grpInfo, setGrpInfo ] = useState(false);
	const [ userRole, setUserRole ] = useState<string>("");
	const [ buttonState, setButtonState ] = useState<string[]>([]);
	const [ isClicked, setIsClicked ] = useState<number[]>([]);
	const navigate = useNavigate();

	const handleAdminClick = (index: number) => {
		setAdminClic(adminClic > -1 ? -1 : index);
		handleSFX("clic");
	};
	const handleAction = async (username: string, index: number, action?: string) => {
		if (action === "mute" || action === "kick" || action === "ban" || action === "block")
		{
			if (action === "mute" && props.group.muted.includes(username))
			{
				handleSFX(props.group.muted.includes(username) ? "goBack" : "clic");
				await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/chat/muteState', { roomName: props.group.name, userName: username }, { headers });
				axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getUserData`, { params: { name: username}, headers })
				.then((response) => {
					socket.emit('muteState', props.group.name, response.data.pfp, username, `${username} has been unmuted by ${name}`);
				}).catch((error) => console.error('Error when muting user:', error));
				return ;
			}
			setWarningType({type: action, component: "groupInfos"})
			setUserIdx(index);
			handleSFX("clic");
		}
		else if (action === "unblock")
		{
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/user/unblockUser', { target: username }, { headers });
			const blockedRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getBlocked`, { headers });
			setBlocked(blockedRes.data);
			handleSFX("goBack");
		}
		else if (action === "showProfile")
		{
			setShowIdCard(index);
			setUserIdx(index);
			handleSFX("clic");
		}
		else if (action === "promote" || action === "demote")
		{
			const user = users.find((user) => user.name === username);
			handleSFX(user.role === "admin" ? "goBack" : "clic");
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/chat/roleState', { roomName: props.group.name, userName: username }, { headers });
			axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getUserData`, { params: { name: username}, headers })
			.then((response) => {
				socket.emit('roleState', props.group.name, response.data.pfp, username, `${username} has been ${user.role === "admin" ? "demoted" : "promoted"}`);
			}).catch((error) => console.error('Error when changing user role:', error));
		}
		else if (action === "Chat")
		{
			const friend = friendsData.find((friend: any) => friend.name === username);
			if (friend !== undefined)
			{
				setTalk({pfp: friend.pfp, name: friend.name, isGroup: false, isOwner: undefined});
				setTalkSearched(true);
				if (!chatList.some((item) => item.name === friend.name))
				{
					chatList.unshift({pfp: friend.pfp, name: friend.name, status: friend.status, isGroup: false});
					setChatList([...chatList]);
				}
				handleSFX("header");
				navigate('/chat');
			}
			else
			{
				setIsClicked(isClicked.map((prevState: string, prevIdx: number) => prevIdx === index ? 1 : prevState));
				setTimeout(() => setIsClicked(isClicked.map((prevState: string, prevIdx: number) => prevIdx === index ? 2 : prevState)), 3000);
				setButtonState(buttonState.map((prevState: string, prevIdx: number) => prevIdx === index ? "Not friends" : prevState));
				handleSFX("goBack");
			}
		}
		else if (action === "Accept")
		{
			const spaces = ' '.repeat(7);
			await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateFriendRequest', { friendName: username, action: "accept" }, { headers });
			socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
			setIsClicked(isClicked.map((prevState: string, prevIdx: number) => prevIdx === index ? 1 : prevState));
			setTimeout(() => {
				setIsClicked(isClicked.map((prevState: string, prevIdx: number) => prevIdx === index ? 2 : prevState));
			setButtonState(buttonState.map((prevState: string, prevIdx: number) => prevIdx === index ? "Chat" : prevState));
			setIsClicked(isClicked.map((prevState: string, prevIdx: number) => prevIdx === index ? 0 : prevState));
			}, 3000);
			setButtonState(buttonState.map((prevState: string, prevIdx: number) => prevIdx === index ? "Friend Accepted!" : prevState));
			setRefreshFriends(true);
			socket.emit('joinRoom', null, null, name, `${name}${spaces}${username}`, null);
			handleSFX("clic");
		}
		else if (action === "Add")
		{
			await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/addUser', { targetName: username }, { headers })
			.then((response) => {
				if (response.data === "Invitation Sent!" || response.data === "Fake" || response.data === "Already Friends")
				{
					setIsClicked(isClicked.map((prevState: string, prevIdx: number) => prevIdx === index ? 1 : prevState));
					setTimeout(() => setIsClicked(isClicked.map((prevState: string, prevIdx: number) => prevIdx === index ? 2 : prevState)), 3000);
					if (response.data === "Invitation Sent!")
						socket.emit('addFriend', username, name, pfp);
					setButtonState(buttonState.map((prevState: string, prevIdx: number) => prevIdx === index ? response.data === "Already Friends" ? "Already Friends" : "Invitation Sent!" : prevState));
					if (response.data === "Already Friends")
						setRefreshFriends(true);
					handleSFX(response.data === "Already Friends" ? "goBack" : "clic");
				}
			}).catch((error) => {
				handleSFX("goBack");
				console.error('Error adding friend:', error);
			});
		}
	};
	const handleEyePass = () => {
		setShowPass(!showPass)
		showPass ?  handleSFX("goBack") : handleSFX("clic");
	};
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter')
			e.preventDefault();
	};
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};
	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (grpInfo)
		{
			handleSFX("goBack")
			return ;
		}
		if (((!formData.name.length || formData.name.length >= 2)
		&& (!formData.password.length || formData.password.length >= 4)
		&& (!formData.description.length || formData.description.length >= 6))
		|| (isValid.capacity && formData.capacity !== props.group.capacity))
		{
			const res = await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + "/user/editInfoGroup", { roomName: props.group.name, formData: formData }, { headers });
			if (res.data === "Name Exist")
			{
				setFormHolder((prevState) => ({ ...prevState, name: "Name Exist"}));
				setFormData((prevState) => ({ ...prevState, name: '' }));
				setIsValid((prevState) => ({ ...prevState, name: false }));
				handleSFX('goBack');
			}
			else if (res.data === "Too Low")
			{
				setFormHolder((prevState) => ({ ...prevState, capacity: "Too Low"}));
				setIsValid((prevState) => ({ ...prevState, capacity: false }));
				setTimeout(() => {
					setFormData((prevState) => ({ ...prevState, capacity: props.group.capacity}));
					setIsValid((prevState) => ({ ...prevState, capacity: true }));
				}, 2000);
				handleSFX('goBack');
			}
			else
			{
				props.setEditing(true);
				props.setGroupInfo((prevState) => ({...prevState, name: formData.name.length ? formData.name : props.group.name, capacity: formData.capacity !== props.group.capacity ? formData.capacity : props.group.capacity, description: formData.description.length ? formData.description : props.group.description}));
				setFormHolder({name: formData.name.length ? formData.name : props.group.name, password: 'New Password', description: formData.description.length ? formData.description : props.group.description});
				setFormData({name: '', password: '', capacity: formData.capacity !== props.group.capacity ? formData.capacity : props.group.capacity, description: ''});
				setIsValid({name: true, password: true, capacity: true, description: true});
				setIsEdit(true);
				setTimeout(() => setIsEdit(false), 2000);
				handleSFX('clic');
			}
		}
		else
		{
			if ((formData.name && formData.name.length < 2) || formData.name === props.group.name)
			{
				setFormHolder((prevState) => ({ ...prevState, name: !formData.name.length ? 'Required' : "Name Too Short"}));
				setFormData((prevState) => ({ ...prevState, name: '' }));
				setIsValid((prevState) => ({ ...prevState, name: false }));
			}
			else
			{
				setFormHolder((prevState) => ({ ...prevState, name: props.group.name}));
				setIsValid((prevState) => ({ ...prevState, name: true }));
			}
			if (formData.password && formData.password.length < 4)
			{
				setFormHolder((prevState) => ({ ...prevState, password: 'Password Too Short' }));
				setFormData((prevState) => ({ ...prevState, password: '' }));
				setIsValid((prevState) => ({ ...prevState, password: false }));
			}
			else
			{
				setFormHolder((prevState) => ({ ...prevState, password: 'New Password' }));
				setIsValid((prevState) => ({ ...prevState, password: true }));
			}
			if (formData.description && formData.description.length < 6)
			{
				setFormHolder((prevState) => ({ ...prevState, description: 'Description Too Short' }));
				setFormData((prevState) => ({ ...prevState, description: '' }));
				setIsValid((prevState) => ({ ...prevState, description: false }));
			}
			else
			{
				setFormHolder((prevState) => ({ ...prevState, description: props.group.description }));
				setIsValid((prevState) => ({ ...prevState, description: true }));
			}
			handleSFX('goBack');
		}
	};
	const handleInfo = () => {
		setGrpInfo(true);
		handleSFX('clic');
	};
	useEffect(() => {
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + "/user/get-users", { params: { roomName: props.group.name }, headers })
		.then((res) => {
			setUsers(res.data);
			const myRole = res.data.find((user) => user.name === name)!.role
			setUserRole(myRole);
			if (myRole === "owner")
				setChatList(chatList.map((chat) => chat.name === props.group.name ? { ...chat, isOwner: true } : chat));
			setIsClicked(new Array(res.data.length).fill(0));
			setButtonState(res.data.map((user) => friendsData.some((friend) => friend.name === user.name) ? "Chat" : friendRequest.find((request) => request.name === user.name) ? "Accept" : "Add"));
			props.setLoading("infosLoaded");
		})
		.catch((err) => {
			console.log(err);
		});
	}, [refreshGroupInfo]);
	return(props.loading === "infosLoading" ? <Container $centerInfos={true}><Loader /></Container> : <Container $centerInfos={showIdCard === userIdx}>
				<Content style={{height: userRole === "owner" ? "12.4%" : "10%", marginTop: "-1vh", display: showIdCard === userIdx ? "none" : "flex"}}>
					{userRole === "owner" ?
					<AdminForm onSubmit={handleSubmit} method="get" action="" noValidate>
						<div style={{width: "85%", display: "flex", flexDirection: "column", alignItems: "center"}}>
							<div style={{display: "flex", alignItems: "center", width: "100%", height: "50%"}}>
								<GroupName $isValid={isValid.name} type='text' name='name' autoComplete="off" value={formData.name} placeholder={formHolder.name} maxLength={10} onChange={handleInputChange} onKeyDown={handleKeyDown} style={{ border: `1px solid ${isValid.name ? "dimgrey" : "lightgrey"}`}}/>
								<PassField style={{border: `1px solid ${isValid.password ? "dimgrey" : "lightgrey"}`}}>
									<Password $isValid={isValid.password} type={showPass ? 'text' : 'password'} name='password' placeholder={formHolder.password} value={formData.password} autoComplete="off" maxLength={30} onChange={handleInputChange} onKeyDown={handleKeyDown}/>
									<EyePass style={{padding: showPass ? "0.5vh 0.25vw" : "0.5vh 0.3vw", borderLeft: `1px solid ${isValid.password ? "dimgrey" : "lightgrey"}`}} onClick={handleEyePass} src={showPass ? handleSVG("hidePass") : handleSVG("showPass")} alt={showPass ? "ShowPass.svg" : "HidePass.svg"}/>
								</PassField>
								<Capacity $isValid={isValid.capacity} type='number' name='capacity' placeholder={formHolder.capacity} autoComplete="off" value={isValid.capacity ? formData.capacity : ''} min={2} max={10} onChange={handleInputChange} onKeyDown={(e) => e.preventDefault()} style={{caretColor: "transparent", border: `1px solid ${isValid.capacity ? "dimgrey" : "lightgrey"}`}}></Capacity>
							</div>
							<Description type='text' name='description' $isValid={isValid.description} autoComplete="off" value={formData.description} placeholder={formHolder.description} maxLength={50} onChange={handleInputChange} onKeyDown={handleKeyDown} style={{border: `1px solid ${isValid.description ? "dimgrey" : "lightgrey"}`}}/>
						</div>
						<div style={{width: "15.4%", display: "flex", justifyContent: "center", alignItems: "center", textAlign: "start", marginLeft: "-1vw"}}>
							{isEdit ? <Text style={{fontSize: "2vh", marginRight: "2vw"}}>Edit Saved!</Text> :
							<><Confirm type="submit">Save</Confirm>
							<Info onClick={handleInfo}>?</Info></>}
						</div>
					</AdminForm> :
					<TextContent>
						<Text style={{textAlign: "center"}}>{props.group.description}</Text>
					</TextContent>}
				</Content>
				{grpInfo && <CreateInfo setInfo={setGrpInfo}/>}
				<Content style={{height: userRole === "owner" ? "87.6%" : "90%", marginTop: userRole === "owner" ? "0.7vh" : "-0.3vh" , display: showIdCard === userIdx ? "none" : "flex"}}>
					<UserContainer>
						{users.map((user, index) => (
						<Card style={{display: user.name === name ? "none" : "flex"}} key={index} onMouseLeave={() => setAdminClic(-1)}>
							<Block>
								<Picture src={user.pfp} alt="Picture.png"/>
							</Block>
							<Block style={{flexDirection: "column", marginRight: "0.5vw"}}>
								<Role style={{height: "2.5vh"}} src={user.role !== "owner" ? user.role !== "admin" ? handleSVG("user") : handleSVG("admin") : handleSVG("crown")} alt='Role.svg'/>
								<Text style={{fontSize: "1vw", maxWidth: "7vw", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"}}>{user.nameDisplay}</Text>
							</Block>
							{isClicked[index] === 1 ? <p style={{width: "42.15%", fontSize: "1.2vw"}}>{buttonState[index]}</p> : <><Block style={{flexDirection: "column"}}>
								<StyledButton style={adminClic === index ? {marginBottom: "1vh"} : {}} onClick={() => handleAction(user.name, index, adminClic === index && userRole === "owner" ? user.role === "user" ? "promote" : "demote" : "showProfile")}>{adminClic === index && userRole === "owner" ? user.role === "user" ? "Promote" : "Demote" : "ID Card"}</StyledButton>
								{adminClic === index && <StyledButton onClick={() => handleAction(user.name, index, "mute")}>{props.group.muted.includes(user.name) ? "Unmute" : "Mute"}</StyledButton>}
							</Block>
							<Block style={{flexDirection: "column"}}>
								{(adminClic === index || (isClicked[index] !== 2 && !blocked.includes(user.name) && !user.isPending)) && <StyledButton onClick={() => handleAction(user.name, index, adminClic === index ? "kick" : buttonState[index])} style={{marginBottom: "1vh"}}>{adminClic === index ? "Kick" : buttonState[index]}</StyledButton>}
								<StyledButton onClick={() => handleAction(user.name, index, adminClic === index ? "ban" : blocked.includes(user.name) ? "unblock" : "block")}>{adminClic === index ? "Ban" : blocked.includes(user.name) ? "Unblock" : "Block"}</StyledButton>
							</Block></>}
							<Block style={{visibility: (userRole === "owner" || (userRole === "admin" && user.role === "user")) ? "visible" : 'hidden', width: "5%"}}>
								<StyledButton onClick={() => handleAdminClick(index)} style={{width: "30%", height: "30%"}}>
									<img style={{height: "2.1vh", margin: adminClic === index ? "-0.3vh -0.2vw 1vh -0.2vw" : "-0.3vh -0.25vw 1vh -0.3vw"}} src={adminClic === index ? handleSVG("arrow-left") : handleSVG("arrow-down")} alt="AdminBtn.png"/>
								</StyledButton>
							</Block>
						</Card>))}
						{(users.length % 2 !== 0 || users.length === 10 ) && users.length > 2 && <Card style={{border: 'none', background: "none"}}></Card>}
					</UserContainer>
				</Content>
				{warningType.type.length > 0 && warningType.component === "groupInfos" && <Warning name={users[userIdx].name} groupName={props.group.name}/>}
				{showIdCard === userIdx && <IdCard username={users[userIdx].name} isLocal={false}/>}
			</Container>);
}

export default GroupInfos;
