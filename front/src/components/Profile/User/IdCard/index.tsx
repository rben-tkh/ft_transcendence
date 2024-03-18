import { ChangeEvent, RefObject, useContext, useEffect, useRef, useState, useMemo } from "react";
import styled from "styled-components";
import RankInfo from '../RankInfo/'
import BadgeInfo from '../BadgeInfo/'
import { ProfileContext } from "../../../../utils/context/ProfileContext";
import { SoundContext } from "../../../../utils/context/SoundContext";
import { useLocation } from "react-router-dom";
import { WebSocketContext } from "../../../../utils/context/WebSocketContext";
import { ChatContext } from "../../../../utils/context/ChatContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TwoFa from "../Twofa/";
import Loader from "../../../../utils/styles/Loader";
import NotSupported from "../../../../assets/images/chat/fileNotSupported.svg";

const Container = styled.div`
	width: 75%;
	height: 90%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	text-align: center;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border: 2px solid dimgrey;
	border-radius: 5px;
`;

const LoaderContainer = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`

const Public = styled.div`
	width: 100%;
	display: flex;
	flex-direction: row;
	text-align: center;
	align-items: center;
`

const Banner = styled.div`
	height: 15%;
	width: 100%;
	display: flex;
	border-bottom: 2px solid dimgrey;
`

const BannerElement = styled.div`
	width: 30%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	text-align: center;
`

const IDCard = styled.div`
	height: 100%;
	width: 30%;
	display: flex;
	flex-direction: column;
	justify-content: start;
	align-items: center;
	border-right: 2px solid dimgrey;
`

const PPElem = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 40%;
	width: 100%;
	margin-top: 2.5vh;
`

const InputPfp = styled.input`
	position: fixed;
	top: 34%;
	left: 17.1%;
	translate: transform(-50%, -50%);
	height: 16vh;
	width: 10vw;
	opacity: 0;
	z-index: 9;
	border-radius: 10px;
`

const InputName = styled.input<{ $isEmpty: boolean, $isValid: boolean, $isLocal: boolean, $showEditName: boolean }>`
	width: 95%;
	font-size: 2vw;
	text-align: center;
	background: ${(props) => props.$showEditName ? "rgb(50, 50, 50)" : "transparent"};
	border: ${(props) => props.$isLocal && props.$showEditName ? props.$isValid ? "1px solid dimgrey" : "1px solid lightgrey" : "1px solid transparent"};
	border-radius: ${(props) => props.$showEditName ? "5px" : "none"};
	caret-color: ${(props) => props.$showEditName ? "lightgrey" : "transparent"};
	&:hover{
		opacity: ${(props) => props.$isLocal && !props.$showEditName ? "0.5" : "1"};
		cursor: ${(props) => !props.$isLocal ? "default" : props.$showEditName ? "text" : "pointer"};
		border: ${(props) => props.$isLocal ? props.$isValid ? "1px solid dimgrey" : "1px solid lightgrey" : "1px solid transparent"};
		border-radius: 5px;
	};
	&:active {
		opacity: 1;
	};
	&::-webkit-input-placeholder {
		font-size: ${(props) => props.$isEmpty && props.$isValid ? "2vw" : "1.5vw"}; ;
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const Picture = styled.img<{ $isLocal: boolean, $isHover: boolean, $isInvalid: boolean }>`
	border: ${(props) => props.$isInvalid ? "1px solid lightgrey" : "1px solid dimgrey"};
	border-radius: 10px;
	object-fit: cover;
	height: 16vh;
	width: 10vw;
	cursor: ${(props) => !props.$isInvalid && props.$isLocal ? "pointer" : "cursor"};
	opacity: ${(props) => props.$isHover && !props.$isInvalid ? "0.3" : "1"};
`

const Stats = styled.div`
	height: 100%;
	width: 30%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
`

const StatsElement = styled.div<{ $isTitle: boolean }>`
	height: 10%;
	width: 100%;
	display: flex;
	align-items: center;
	text-align: center;
	border-bottom: 2px solid dimgrey;
	background: ${(props) => (props.$isTitle ? "transparent" : "rgb(60, 60, 60)")};
`

const Info = styled.button`
	font-size: 1.8vh;
	padding: 0.4vh 0.5vw 0.4vh 0.5vw;
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 100%;
	cursor: pointer;
	background: transparent;
	&:hover{background: rgba(255, 255, 255, 0.2);}
	&:active{background: rgba(255, 255, 255, 0.5);}
	transition: background-color 200ms ease-in-out;
`

const Badges = styled.div`
	width: 40%;
	height: 100%;
	display: flex;
	flex-direction: column;
	border-left: 2px solid dimgrey;
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
`

const Achievement  = styled.div<{ $isLocal: boolean, $isUnlocked: boolean, $isChoosen: boolean }>`
	width: 100%;
	height: 20%;
	display: flex;
	flex-direction: row;
	margin-top: 2px;
	margin-bottom: 2px;
	background: ${(props) => props.$isLocal && props.$isChoosen ? "rgb(75, 75, 75)" : "transparent"};
	cursor: ${(props) => props.$isLocal && props.$isUnlocked && !props.$isChoosen ? "pointer" : "default"};
	border-top: 2px solid dimgrey;
	border-bottom: 2px solid dimgrey;
	opacity: ${(props) => props.$isUnlocked ? "1" : "0.5"};
	&:hover{
		background: ${(props) => props.$isLocal && !props.$isChoosen && props.$isUnlocked ? "rgb(60, 60, 60)" : ""};
	}
	&:active{
		background: ${(props) => props.$isLocal && !props.$isChoosen && props.$isUnlocked ? "rgb(75, 75, 75)" : ""};
	}
	transition: background-color 150ms ease-in-out;
`

const Text = styled.p<{$isLocal?: boolean, $isInvisible?: boolean, $isUnlocked?: boolean, $isChoosen?: boolean}>`
	font-size: ${(props) => props.$isInvisible ? "1.4vw" : "1.5vw"};
	margin: 0.2vh 0.1vw;
	font-weight: 500;
	text-align: center;
	cursor: ${(props) => props.$isLocal && (props.$isInvisible || (props.$isUnlocked && !props.$isChoosen)) ? "pointer" : "default"};
	&:hover{
		opacity: ${(props) => props.$isInvisible ? "0.5" : "1"};
	};
	&:active{
		opacity: ${(props) => props.$isInvisible ? "0.7" : "1"};
	};
`

const StatsText = styled.p<{ $isTitle: boolean }>`
	width: ${(props) => (props.$isTitle ? "100%" : "50%")};
	font-size: 1.2vw;
	font-weight: 500;
	text-align: center;
	margin: auto;
`

const Private = styled.div`
	width: 100%;
	height: 15%;
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	border-top: 2px solid dimgrey;
`

const StyledButton = styled.button`
	height: 50%;
	width: 15%;
	font-size: 1vw;
	border: 1px solid rgb(70, 70, 70, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const AddButton = styled.button`
	font-size: 2vh;
	padding: 0.5vh 1vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

function IdCard(props: {username: string, isLocal: boolean, isPending?: boolean})
{
	const navigate = useNavigate();
	const location = useLocation();
	const { handleSVG, setTalk, setTalkSearched, chatList, setChatList, setRefreshFriends } = useContext(ChatContext);
	const { name, pfp, nameDisplay, setNameDisplay, tfa, setTfa, badgeIdx, setBadgeIdx, achievements, setShowMatchHistory, setpfp, setLogged, friendsData, friendRequest, blocked, setBlocked } = useContext(ProfileContext);
	const [ isProfilePrivate, setIsProfilePrivate ] = useState<boolean>(false);
	const [ declineAuto, setDeclineAuto ] = useState<boolean>(false);
	const [ showRankInfo, setShowRankInfo ] = useState<boolean>(false);
	const [ showBadgeInfo, setShowBadgeInfo ] = useState<boolean>(false);
	const { handleSFX } = useContext(SoundContext);
	const { socket, headers } = useContext(WebSocketContext);
	const [ isInvisible, setIsInvisible ] = useState(false);
	const [ showEditPicture, setShowEditPicture ] = useState<boolean>(false);
	const [ showEditName, setShowEditName ] = useState<boolean>(false);
	const [ inputPfp, setInputPfp ] = useState<string>("");
	const [ realName, setRealName ] = useState('');
	const [ inputName, setInputName ] = useState(props.username);
	const [ inputHolder, setInputHolder ] = useState(nameDisplay)
	const [ inputChanged, setInputChanged ] = useState(true);
	const [ nameIsValid, setNameIsValid ] = useState(true);
	const inputRef: RefObject<HTMLInputElement> = useRef(null);
	const [date, setDate ] = useState<string>("")
	const [displayTwoFA, setDisplayTwoFA] = useState<boolean>(false);
	const [ loaded, setLoaded ] = useState<boolean>(0);
	const [ simpleStat, setSimpleStat ] = useState({ rank: 'Rookie', win: 0, lose: 0, rankRate: 0 });
	const [ doubleStat, setDoubleStat ] = useState({ rank: 'Rookie', win: 0, lose: 0, rankRate: 0 });
	const [ invalidFile, setInvalidFile ] = useState<boolean>(false);
	const [ isPrivate, setIsPrivate ] = useState<boolean>(false);
	const [ userStatus, setUserStatus ] = useState<string>("");
	const [ allIndex, setAllIndex ] = useState<number[]>([]);
	const [ pAction, setPAction ] = useState<string>("");
	const buttonAction = useMemo(() => {
		if (props.username === name || props.isPending)
			return ("");
		else if (blocked.includes(props.username))
			return ("Unblock");
		else if (friendsData.some((friend) => friend.name === props.username))
			return ("Chat");
		else if (friendRequest.some((user) => user.name === props.username))
			return ("Accept");
		else
			return ("Add");
		}, [props, name, blocked, friendsData, friendRequest, pAction]);

//////////////////////////////////Edit la photo de profil////////////////////////////////////////
	const handleFileChange = async (event : ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0])
		{
			const file = event.target.files[0];
			const formData = new FormData();
			if (!file.type.startsWith('image/'))
			{
				handleSFX("goBack");
				setInvalidFile(true);
				setShowEditPicture(false);
				setTimeout(() => setInvalidFile(false), 3000);
				return ;
			}
			formData.append('file', file);
			formData.append('name', props.username);
			try {
				const response = await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/edit', formData, { headers });
				socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
				setpfp(response.data.pfp_url);
				setInputPfp(response.data.pfp_url);
				handleSFX("clic");
			} catch (error) {
				handleSFX("goBack");
				setInvalidFile(true);
				setShowEditPicture(false);
				setTimeout(() => setInvalidFile(false), 3000);
				console.error('Erreur lors de l\'upload', error);
			}
		}
	}
	const handleDisplayInput = () => {
		if (props.isLocal && !showEditName)
		{
			setShowEditName(true);
			handleSFX("clic");
		}
	}
	//////////////////////////////////Edit le nom de profil////////////////////////////////////////	
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (props.isLocal)
		{
			setInputName(e.target.value);
			setInputChanged(true);
		}
	}

	const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && inputChanged && inputName.length && inputName !== props.username)
		{
			try {
				const response = await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/updateName`, { newName: inputName }, { headers });
				if (typeof response.data !== "string")
				{
					setNameDisplay(inputName);
					setInputName(inputName);
					setInputHolder(inputName);
					setNameIsValid(true);
					setShowEditName(false)
					socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
					handleSFX("clic");
				}
				else if (response.data)
				{
					setInputHolder(response.data);
					setInputName("");
					setNameIsValid(false);
					handleSFX("goBack");
				}
				if (inputRef.current)
					inputRef.current.blur();
				setInputChanged(false);
			} catch (error) {
				console.error('Erreur lors de la mise à jour du nom', error);
			}
		}
	};
	const handleDisplayMatchHistory = () => {
		setShowMatchHistory(true);
		handleSFX("clic");
	}
	const handleBadgeClick = async (index: number) => {
			if (props.isLocal && badgeIdx !== index && allIndex.includes(index))
		{
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/newBadgeSelected`, { index: index}, { headers });
			setBadgeIdx(index);
			handleSFX("clic");
		}
	}
//////////////////////////////////INVISBLE MODE////////////////////////////////////////
	const handleChangeVisibility = async () => {
		if (!props.isLocal)
			return ;
		handleSFX(isInvisible ? "clic" : "goBack");
		await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/user-state-invisible`, { isInvisible: isInvisible}, { headers })
		.then(() => {
			setUserStatus(isInvisible ? "Online" : "Invisible");
			setIsInvisible(!isInvisible);
			socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
		}).catch((err) => {
			console.error('Error updating user state invisible mode:', err);
		});
	}
//////////////////////////////////PRIVATE MODE////////////////////////////////////////
	const handlePrivateAcc = async () => {
		handleSFX(isProfilePrivate ? "clic" : "goBack");
		await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/user-state-private`, { isPrivate: isProfilePrivate}, { headers })
		.then(() => {
			setIsProfilePrivate(!isProfilePrivate);
		}).catch((err) => {
			console.error('Error updating user state private mode:', err);
		});
	}
//////////////////////////////////Rejected request ////////////////////////////////////////
	const handleRejectAuto = async () => {
		handleSFX(declineAuto ? "clic" : "goBack");
		await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/user-state-rejectAuto`, { isRejectAuto: declineAuto }, { headers })
		.then(() => {
			setDeclineAuto(!declineAuto);
		}).catch((err) => {
			console.error('Error updating user state reject mode:', err);
		});
	}
//////////////////////////////////2FA////////////////////////////////////////
	const handleTFA = async () => {
		try {
			if (tfa === "disable") 
				await handleEnable();
			setDisplayTwoFA(true);
			handleSFX("clic");
		} catch (error) {
			console.error('Erreur lors de la mise à jour de la 2FA', error);
		}
	};

	const handleEnable = async () => {
		await axios.patch(
			process.env.REACT_APP_URL_LOCAL_BACK + `/user/turn-on`,
			{ state: true },
			{ withCredentials: true, headers }
		)
		.then(response => {
			if (response.data.message === 'Enable 2FA') {
				setTfa("checking");
			}
		})
		.catch(err => {
			console.error('Error enabling 2FA:', err);
		});
	}
	const handleDisable = async () => {
		await axios.patch(
			process.env.REACT_APP_URL_LOCAL_BACK + `/user/turn-off`,
			{ state: false },
			{ withCredentials: true, headers }
		)
		.then(response => {
			if (response.data.message === 'Disabled 2FA') {
				setTfa("disable");
			}
		})
		.catch(err => {
			console.error('Error disabling 2FA:', err);
		});
	}
	useEffect(() => {
		if (tfa === "canceled" || (tfa === "checking" && !displayTwoFA)) {
			handleDisable();
		}
	}, [tfa]);
//////////////////////////////////LOGOUT////////////////////////////////////////
	const handleLogout  = async () => {
		handleSFX("exit");
		try {
			await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + `/auth/logout`, {}, { headers });
			socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
			localStorage.clear()
			setLogged(false);
			Cookies.remove('accessToken');
			navigate("/");
		} 
		catch (err: any) {
			if ((err).response?.status === 401) {
				localStorage.clear()
				setLogged(false);
				Cookies.remove('accessToken')
				navigate("/");
			} 
			else
				console.error('Erreur lors de la déconnexion:', err);
		} 
	}

	const handleAction = async () => {
		if (buttonAction === "Unblock")
		{
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/user/unblockUser', { target: props.username }, { headers });
			const blockedRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getBlocked`, { headers });
			setBlocked(blockedRes.data);
			handleSFX("goBack");
		}
		else if (buttonAction === "Chat")
		{
			const friend = friendsData.find((friend: any) => friend.name === props.username);
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
		}
		else if (buttonAction === "Accept")
		{
			const spaces = ' '.repeat(7);
			await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateFriendRequest', { friendName: props.username, action: "accept" }, { headers });
			socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
			setPAction("Friend Accepted!");
			setTimeout(() => setPAction(""), 3000);
			setRefreshFriends(true);
			socket.emit('joinRoom', null, null, name, `${name}${spaces}${props.username}`, null);
			handleSFX("clic");
		}
		else if (buttonAction === "Add")
		{
			await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/addUser', { targetName: props.username }, { headers })
				.then((response) => {
					if (response.data === "Invitation Sent!" || response.data === "Fake" || response.data === "Already Friends" || response.data === "Request Already Sent")
					{
						if (response.data === "Invitation Sent!")
							socket.emit('addFriend', props.username, name, pfp);
						if (response.data === "Already Friends")
							setRefreshFriends(true);
						handleSFX((response.data === "Already Friends" || response.data === "Request Already Sent") ? "goBack" : "clic");
						setPAction(response.data === "Fake" ? "Invitation Sent!" : response.data);
						setTimeout(() => setPAction("DisableButton"), 3000);
				}
				}).catch((error) => {
					handleSFX("goBack");
					console.error('Error adding friend:', error);
				});
		}
	};

	useEffect(() => {
//////////////////////////////////Private and Invisible Mode////////////////////////////////////////
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getProfileStatus`, { params: { name: props.username, isLocal: props.isLocal}, headers })
		.then(response => {
			setIsPrivate(response.data.privateMode);
			setIsInvisible(response.data.invisibleMode);
			setDeclineAuto(response.data.rejectAuto);
			setUserStatus(response.data.state);
			setLoaded((prevState: number) => prevState + 1);
		}).catch(error => console.error('Error:', error));
//////////////////////////////////Name and Photo////////////////////////////////////////
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getUserData`, { params: { name: props.username}, headers })
		.then(response => {
			setRealName(response.data.name)
			setInputHolder(response.data.nameDisplay);
			setInputName(response.data.nameDisplay);
			setInputPfp(response.data.pfp);
			setAllIndex(response.data.achievements);
			setBadgeIdx(response.data.badgeIdx);
			setLoaded((prevState: number) => prevState + 1);
		}).catch(error => console.error('Error:', error));
//////////////////////////////////Date////////////////////////////////////////
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/date`, { params: { name: props.username}, headers })
		.then(response => {
			const date = new Date(response.data.date);
			const formattedDate = `${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}-${date.getFullYear()}`;		
			setDate(formattedDate);
			setLoaded((prevState: number) => prevState + 1);
		}).catch(error => console.error('Error:', error));
//////////////////////////////////Games Stats////////////////////////////////////////
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/getUserData', { params: { name: props.username}, headers })
		.then(response => {
			if (response.data.simple)
			{
				setSimpleStat(response.data.simple);
				setLoaded((prevState: number) => prevState + 1);
			}
			if (response.data.double)
			{
				setDoubleStat(response.data.double);
				setLoaded((prevState: number) => prevState + 1);
			}
		}).catch(error => console.error('Error:', error));
	}, []);

	return (loaded < 5 ? <LoaderContainer><Loader /></LoaderContainer> : 
			<Container style={location.pathname === "/chat" ? {width: "95%"} : props.isLocal ? {} : {height: "99%"}}>
				{!props.isLocal && isPrivate ?
				<>
					<img src={handleSVG("mask")} alt="Mask.svg" style={{height: "12vh", marginBottom: "1vh"}}/>
					<Text style={{fontSize: "2vw", marginBottom: "2vh"}}>Whoops!</Text>
					<Text style={{marginBottom: "1vh"}}>It seems like this profile is more secretive than a spy's ID.</Text>
					<Text style={{marginBottom: "1vh"}}>Sorry, but it's a private profile!</Text>
					<Text style={{marginBottom: "1vh"}}>You don't have the clearance to know more.</Text>
					<Text style={{marginBottom: "5vh"}}>For any top-secret mission, please contact the agent.</Text>
				</> :
				<><Banner>
					<BannerElement>
						<Text style={{fontSize: "1.8vw"}}>#{realName}</Text>
					</BannerElement>
					<BannerElement style={{borderLeft: "2px solid dimgrey", borderRight: "2px solid dimgrey"}}>
						<Text style={{fontSize: "1.8vw", marginRight: "1vw"}}>Stats</Text>
						<Info onClick={() => {setShowRankInfo(true); handleSFX("clic")}}>?</Info>
					</BannerElement>
					<BannerElement style={{margin: "auto"}}>
						<Text style={{fontSize: "1.6vw", marginRight: "1vw"}}>Achievements</Text>
						<Info onClick={() => {setShowBadgeInfo(true); handleSFX("clic")}}>?</Info>
					</BannerElement>
				</Banner>
				<Public style={{height: props.isLocal ? "70%" : "100%"}}>
					<IDCard>
						<PPElem >
							{!invalidFile && props.isLocal && <InputPfp type="file" onChange={handleFileChange} onMouseEnter={() => setShowEditPicture(true)} onMouseLeave={() => setShowEditPicture(false)}/>}
							<Picture $isLocal={props.isLocal} $isHover={props.isLocal ? showEditPicture : false} $isInvalid={invalidFile} src={invalidFile ? NotSupported : inputPfp} alt="Picture.png"/>
							{props.isLocal && showEditPicture && <img style={{ position: "absolute", top: "41%", left: "22.5%", height: "4vh", cursor: "pointer"}} src={handleSVG('edit')} alt='Edit.svg'/>}
							{invalidFile && <p style={{ position: "absolute", top: "75%", left: "24%", fontSize: "1.7vh"}}>Invalid File</p>}
						</PPElem>
						<div style={{height: "50%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", textAlign: "center"}}>
							<div style={{height: props.isLocal ? "25%" : "20%", width: "100%"}}>
								{<InputName ref={inputRef} type="text" placeholder={inputHolder} value={inputName} readOnly={props.isLocal ? false : "readonly"}
								$isEmpty={inputName.length ? false : true} $isValid={nameIsValid} $isLocal={props.isLocal} $showEditName={showEditName}
								onClick={handleDisplayInput} onChange={handleChange} onKeyDown={handleKeyDown} maxLength={10}/>}
							</div>
							<Text style={{marginTop: "-0.5vh"}} $isInvisible={props.isLocal ? true : false} onClick={handleChangeVisibility}>{isInvisible && props.isLocal ? 'Invisible' : isInvisible && !props.isLocal ? "Offline" : userStatus}</Text>
							<Text style={{fontSize: "1.1vw"}}>Registered since:<br />{date}</Text>
							{buttonAction.length > 0 && !pAction.length && <AddButton style={{marginTop: "0.5vh"}} onClick={handleAction}>{buttonAction}</AddButton>}
							{props.username !== name && pAction.length > 0 && pAction !== "DisableButton" && <Text style={{fontSize: "1.2vw", marginTop: "1.3vh"}}>{pAction}</Text>}
						</div>
					</IDCard>
					<Stats>
						<StatsElement $isTitle={true}>
							<StatsText $isTitle={true} style={{fontSize: "1.8vw", marginTop: !props.isLocal && location.pathname !== "/chat" ? "0.3vh" : "-1.5vh"}}>Game Option</StatsText>
						</StatsElement>
						<StatsElement $isTitle={false}>
							<StatsText style={{borderRight: "2px solid dimgrey"}} $isTitle={false}>Simple</StatsText>
							<StatsText $isTitle={false}>Double</StatsText>
						</StatsElement>
						<StatsElement $isTitle={true}>
							<StatsText $isTitle={true}>Rank</StatsText>
						</StatsElement>
						<StatsElement $isTitle={false}>
							<StatsText style={{borderRight: "2px solid dimgrey"}} $isTitle={false}>{simpleStat.rank}</StatsText>
							<StatsText $isTitle={false}>{doubleStat.rank}</StatsText>
						</StatsElement>
						<StatsElement $isTitle={true}>
							<StatsText $isTitle={true}>Ratio</StatsText>
						</StatsElement>
						<StatsElement $isTitle={false}>
							<StatsText style={{borderRight: "2px solid dimgrey"}} $isTitle={false}>{simpleStat.win}W / {simpleStat.lose}L</StatsText>
							<StatsText $isTitle={false}>{doubleStat.win}W / {doubleStat.lose}L</StatsText>
						</StatsElement>
						<StatsElement $isTitle={true}>
							<StatsText $isTitle={true}>Rank Rate</StatsText>
						</StatsElement>
						<StatsElement $isTitle={false}>
							<StatsText style={{borderRight: "2px solid dimgrey"}} $isTitle={false}>{simpleStat.rankRate} RR</StatsText>
							<StatsText $isTitle={false}>{doubleStat.rankRate} RR</StatsText>
						</StatsElement>
						<StatsElement $isTitle={true} style={{display: !props.isLocal && location.pathname !== "/chat" ? "flex" : "none", height: "15%", justifyContent: "center", borderBottom: "none"}}>
							<StyledButton onClick={handleDisplayMatchHistory} style={{width: "75%", height: "60%"}}>Match History</StyledButton>
						</StatsElement>
						{showRankInfo && <RankInfo setRankInfo={setShowRankInfo}/>}
					</Stats>
					<Badges>
						{achievements.slice(1).map((achievement, index) => (
							<Achievement key={index} onClick={() => handleBadgeClick(index)}
							$isLocal={props.isLocal} $isUnlocked={allIndex.includes(index) ? true : false}
							$isChoosen={index === badgeIdx ? true : false}>
								{allIndex.includes(index) ?
								<>
									<img style={{height: "100%"}} src={achievement.picture} alt="Achievement.png"/>
									<div style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", justifyContent: "center"}}>
										<Text $isLocal={props.isLocal} $isChoosen={index === badgeIdx ? true : false} $isUnlocked={true} style={{fontSize: "1vw"}}>{achievement.title}</Text>
										<Text $isLocal={props.isLocal} $isChoosen={index === badgeIdx ? true : false} $isUnlocked={true} style={{fontSize: "0.8vw"}}>{achievement.description}</Text>
									</div>
								</> :
								<>
									<img style={{height: "100%"}} src={achievements[0].picture} alt="Unknown.png"/>
									<div style={{display: "flex", flexDirection: "column", width: "100%", height: "100%", justifyContent: "center"}}>
										<Text style={{fontSize: "1vw"}}>{achievement.title}</Text>
										<Text style={{fontSize: "0.8vw"}}>{achievement.description}</Text>
									</div>
								</>}
							</Achievement>))}
						{showBadgeInfo && <BadgeInfo setBadgeInfo={setShowBadgeInfo}/>}
					</Badges>
				</Public>
				<Private style={{ display: props.isLocal ? 'flex' : 'none' }}>
					<StyledButton onClick={handlePrivateAcc}>Profile: {isProfilePrivate ? 'Private' : 'Public'}</StyledButton>
					<StyledButton style={{width: "20%"}} onClick={handleRejectAuto}>Reject Requests: {declineAuto ? 'On' : 'Off'}</StyledButton>
					<StyledButton onClick={handleTFA}>2fa: {tfa === "enable" ? 'Enable' : 'Disable'}</StyledButton>
					<StyledButton onClick={handleLogout}>Logout</StyledButton>
				</Private></>}
				{displayTwoFA && <TwoFa setDisplayTwoFA={setDisplayTwoFA}/>}
			</Container>);
}

export default IdCard;
