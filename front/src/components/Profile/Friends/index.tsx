import { NodeJS } from 'node';
import { useState, useContext, useEffect, useRef, ChangeEvent, RefObject } from "react";
import styled from "styled-components";
import { SoundContext } from "../../../utils/context/SoundContext";
import IdCard from "../User/IdCard";
import MatchHistory from "../MatchHistory";
import { ProfileContext } from "../../../utils/context/ProfileContext";
import Warning from "../../Warning";
import { Link, useNavigate } from "react-router-dom";
import { ChatContext } from "../../../utils/context/ChatContext";
import axios from 'axios';
import { WebSocketContext } from "../../../utils/context/WebSocketContext";
import Loader from '../../../utils/styles/Loader';
import { GameContext } from '../../../utils/context/GameContext';

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	font-size: 2vh;
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
`;

const LoaderContainer = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`

const CardContainer = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	overflow-y: auto;
	overflow-x: hidden;
	flex-wrap: wrap;
	flex: 1;
	width: 100%;
	height: 75%;
`

const NoConv = styled.p`
	font-size: 1.7vw;
	font-weight: 600;
	text-align: center;
	margin: auto;
`

const Card = styled.div`
	width: 17%;
	height: 91%;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	justify-content: space-around;
	padding: 1vh 0vw;
	margin: 1vh 0.5vw;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
`;

const Text = styled.p`
	font-size: 1.5vw;
	margin: 0.1vw;
`

const InviteButton = styled.button`
	width: 50%;
	height: 20%;
	font-size: 1.15vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const StyledButton = styled.button`
	width: 50%;
	font-size: 1vw;
	padding: 1vh 0.5vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const StyledLink = styled(Link)`
	width: 50%;
	font-size: 1vw;
	padding: 1vh 0.5vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`;

const FriendRequest = styled.div`
	width: 100%;
	height: 15%;
	display: flex;
	justify-content: space-evenly;
	align-items: center;
	text-align: center;
	background: rgb(35, 35, 35, 0.95);
	border-bottom: 2px solid dimgrey;
`

const ChangePage = styled.button`
	font-size: 1.3vw;
	padding: 1vh 1vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
	cursor: pointer;
`;

const Footer = styled.div`
	width: 100%;
	height: 10%;
	display: flex;
	justify-content: center;
	align-items: center;
	border-top: 2px solid dimgrey;
	border-bottom-left-radius: 10px;
	border-bottom-right-radius: 10px;
	background: rgb(35, 35, 35, 0.95);
`;

const StyledInput = styled.input<{$isValid: boolean}>`
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border-radius: 10px;
	height: 3.5vh;
	width: 60%;
	font-size: 2vh;
	margin: 10px;
	text-align: center;
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const CloseButton = styled.button`
	height: 50%;
	width: 15%;
	font-size: 1vw;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

function Friends(props: {displayFriendCard: boolean, setDisplayFriendCard: (value: boolean) => void})
{
	const navigate = useNavigate();
	const { socket, headers } = useContext(WebSocketContext);
	const { handleSFX } = useContext(SoundContext);
	const { setDataGame, setIsAmical } = useContext(GameContext);
	const { gameInvite, setTalk, setTalkSearched, chatList, setChatList, setRefreshFriends, newMessage } = useContext(ChatContext);
	const { name, friendsData, setFriendsData, showMatchHistory, setShowMatchHistory, warningType, setWarningType, friendRequest, setFriendRequest, pfp, setStatus } = useContext(ProfileContext);
	const [ requestId, setRequestId ] = useState(0);
	const [ showIdCard, setShowIdCard ] =  useState(false);
	const [ isMouseOver, setIsMouseOver ] = useState<number>(-1);
	const [ userIdx, setUserIdx ] = useState<number>(-1);
	const [ isInvite, setIsInvite ] = useState(-1);
	const [ isDifficulty, setIsDifficulty ] = useState(false);
	const [ inviteForDouble, setInviteForDouble ] = useState(false);
	const [ searchInput, setSearchInput ] = useState({name: '', isValid: true, isChanged: true})
	const [ addInput, setAddInput ] = useState({name: '', isValid: true, isChanged: true})
	const searchRef: RefObject<HTMLInputElement> = useRef(null);
	const addRef: RefObject<HTMLInputElement> = useRef(null);
	const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);
	const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const [ searchHolder, setSearchHolder ] = useState('Search Friend By #');
	const [ addHolder, setAddHolder ] = useState('Add Friend By #');
	const [ isFriend, setIsFriend ] = useState(true);
	const [ loading, setLoading ] = useState(true);

	const handlePrev = () => {
		if (requestId > 0)
			setRequestId(requestId - 1);
		handleSFX('clic');
	};
	const handleNext = () => {
		if ((requestId + 1) < friendRequest.length)
			setRequestId(requestId + 1);
		handleSFX('clic');
	};
	const handleAccept = async () => {
		const friendName = friendRequest[requestId].name;
		const spaces = ' '.repeat(7);
		socket.emit('joinRoom', null, null, name, `${name}${spaces}${friendName}`, null);
		setFriendRequest(friendRequest.filter((_: any, index: number) => index !== requestId));
		await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateFriendRequest', { friendName: friendName, action: "accept" }, { headers });
		setRefreshFriends(true);
		socket.emit('newFriendInfo', friendName);
		handleSFX('clic');
	};
	const handleDecline = async () => {
		setFriendRequest(friendRequest.filter((_: any, index: number) => index !== requestId));
		await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateFriendRequest', { friendName: friendRequest[requestId].name, action: "decline" }, { headers });
		setRefreshFriends(true);
		handleSFX('goBack');
	};
	const handleBlock = (index: number, isFriend: boolean) => {
		if (isFriend)
			setUserIdx(index);
		setIsFriend(isFriend);
		setWarningType({type: 'block', component: "friends"});
		handleSFX('clic');
	};
	const handleMouseLeave = () => {
		setIsMouseOver(-1);
		setIsDifficulty(false);
		setIsInvite(-1);
	}
	const handleOption = (isDouble: boolean) => {
		setInviteForDouble(isDouble);
		setIsDifficulty(true);
		handleSFX('clic');
	}
	const handleSpeed = (username: string, newSpeed: string) => {
		handleSFX('header');
		setIsDifficulty(false);
		setIsInvite(-1);
		const speed = newSpeed === "Easy" ? 1 : newSpeed === "Medium" ? 1.5 : 2;
		setIsAmical(true);
		newMessage('game', `${name} ${username} ${inviteForDouble ? "Double" : "Simple"} ${newSpeed} Pending`, username);
		setDataGame({mode: "Online", isDouble: inviteForDouble, speed: speed, opponent: username});
		setStatus("In Matchmaking");
		socket.emit('gameInvite', name, username);
		socket.emit('gameMode', `${name} ${username}`, speed, inviteForDouble, name);
		navigate("/game");
	}
	const handleInvite = (index: number) => {
		setUserIdx(index);
		setIsInvite(index);
		handleSFX('clic');
	}
	const handleRemove = (index: number) => {
		setUserIdx(index);
		setWarningType({type: 'remove', component: "friends"});
		handleSFX('clic');
	};
	const handleChat = async (friendPdp: string, friendName: string, friendStatus: string) => {
		setTalk({pfp: friendPdp, name: friendName, isGroup: false, isOwner: undefined});
		setTalkSearched(true);
		if (!chatList.some((item) => item.name === friendName))
		{
			chatList.unshift({pfp: friendPdp, name: friendName, status: friendStatus, isGroup: false, nbUser: undefined, capacity: undefined, isOwner: undefined});
			setChatList([...chatList]);
		}
		handleSFX('clic');
	};
	const handleShowCard = (index: number) => {
		setShowIdCard(true);
		props.setDisplayFriendCard(true)
		setUserIdx(index);
		handleSFX('clic');
	}
	const handleCloseCard = () => {
		if (showMatchHistory)
			setShowMatchHistory(false);
		else
		{
			setShowIdCard(false);
			props.setDisplayFriendCard(false)
		}
		handleSFX('goBack');
	}
	const handleOnChange = (isSearch: boolean, e: ChangeEvent<HTMLInputElement>) => {
		if (isSearch)
			setSearchInput({name: e.target.value, isValid: searchInput.isValid, isChanged: true});
		else
			setAddInput({name: e.target.value, isValid: addInput.isValid, isChanged: true});
	}
	const handleKeyDown = async (isSearch: boolean, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter')
		{
			if (isSearch && !friendsData.some(user => user.name === searchInput.name) && searchInput.isChanged && searchInput.name.length)
			{
				setSearchInput({name: '', isValid: false, isChanged: false});
				setSearchHolder(searchInput.name.length < 2 ? 'Username Too Short' : 'Friend Not found');
				handleSFX("goBack");
			}
			else if (!isSearch && friendsData.some(user => user.name === addInput.name) && addInput.isChanged)
			{
				setAddInput({name: '', isValid: false, isChanged: false});
				setAddHolder('Already Friends');
				handleSFX("goBack");
			}
			else if (isSearch && searchInput.name.length >= 2 && searchInput.isChanged)
			{
				const index = friendsData.findIndex(user => user.name === searchInput.name);
				setSearchInput({name: '', isValid: true, isChanged: false});
				if (searchRef.current)
					searchRef.current.blur();
				setSearchHolder('Search Friend By #');
				if (selectedCardIndex !== index)
					handleSFX("clic");
				setSelectedCardIndex(index);
				if (cardRefs.current && cardRefs.current[index])
				{
					const cardRef = cardRefs.current[index] as HTMLDivElement;
					if (cardRef)
						cardRef.scrollIntoView({ behavior: "smooth" });
				}
			}
			else if (!isSearch && addInput.isChanged && addInput.name.length)
			{
				const response = await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/addUser', { targetName: addInput.name }, { headers });
				if (response.data)
				{
					if (response.data === "Fake")
						setAddHolder("Invitation Sent!");
					else
					{
						if (response.data === "Friend Accepted!")
						{
							const spaces = ' '.repeat(7);
							await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateFriendRequest', { friendName: addInput.name, action: "accept" }, { headers });
							socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
							socket.emit('joinRoom', null, null, name, `${name}${spaces}${addInput.name}`, null);
							setRefreshFriends(true);
						}
						else if (response.data === "Invitation Sent!")
						{
							await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/setProfileNotif`, { username: addInput.name, notif: 2}, { headers });
							socket.emit('addFriend', addInput.name, name, pfp);
						}
						else
						{
							setAddInput({name: '', isValid: false, isChanged: false});
							handleSFX("goBack");
						}
						setAddHolder(response.data);
					}
				}
			}
		}
	};
	useEffect(() => {
		if (!props.displayFriendCard)
		{
			props.setDisplayFriendCard(false);
			setShowIdCard(false);
			setShowMatchHistory(false);
		}
	}, [props.displayFriendCard])
	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (addHolder === "Invitation Sent!" || addHolder === "Friend Accepted!")
		{
			handleSFX("clic");
			setAddInput({name: '', isValid: true, isChanged: false});
			timeoutId = setTimeout(() => {
				setAddHolder('Add Friend By #');
			}, 2000);
			if (addRef.current)
				addRef.current.blur();
		}
		return () => clearTimeout(timeoutId);
	}, [addHolder]);
	useEffect(() => {
		const fetchDataFriends = async () => {
			try {
				const response = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getFriends`, {headers});
				setFriendsData(response.data);
				setLoading(false);
			} catch (error) {
				console.error(error);
			}
		};
		fetchDataFriends();
	}, []);
	return (loading ? <LoaderContainer><Loader /></LoaderContainer> : <Container>
			{friendRequest.length > 0 && !showIdCard && !showMatchHistory && <FriendRequest>
				<div style={{width: "20%"}}>
					<ChangePage onClick={handlePrev} style={{visibility: requestId > 0 ? "visible" : "hidden", marginLeft: "5vw"}}>{"<"}</ChangePage>
				</div>
				<img src={friendRequest[requestId].pfp} alt="Picture.jpg" style={{borderRadius: "10px", border: "1px solid dimgrey", height: "7vh", width: "auto"}}/>
				<div style={{width: "20%", display: "flex", flexDirection: "column", justifyContent: "center"}}>
					<Text>#{friendRequest[requestId].name}</Text>
					<Text style={{fontSize: "1vw"}}>wants to be friends</Text>
				</div>
				<StyledButton onClick={handleAccept} style={{width: "10%"}}>Accept</StyledButton>
				<StyledButton onClick={handleDecline} style={{width: "10%"}}>Decline</StyledButton>
				<StyledButton onClick={() => handleBlock(0, false)} style={{width: "10%"}}>Block</StyledButton>
				<div style={{width: "20%"}}>
					<ChangePage onClick={handleNext} style={{visibility: (requestId + 1) < friendRequest.length ? "visible" : "hidden", marginRight: "5vw"}}>{">"}</ChangePage>
				</div>
			</FriendRequest>}
			<CardContainer>
				{!friendsData.length && <NoConv>No friends yet.</NoConv>}
				{!showIdCard && !showMatchHistory && friendsData.map((friendData, index) => (
				<Card ref={(ref) => cardRefs.current[index] = ref} key={index} onMouseEnter={() => setIsMouseOver(index)} onMouseLeave={() => handleMouseLeave()} style={{border: selectedCardIndex === index ? "2px solid lightgrey" : "2px solid dimgrey"}}>
					<div style={{width: "100%", height: "50%", display: "flex", flexDirection: "column", justifyContent: "space-around", alignItems: "center", textAlign: "center"}}>
						<img src={friendData.pfp} alt="Picture.png" style={{objectFit: "cover", height: "10vh", width: "60%", border: "1px solid dimgrey", borderRadius: "10px"}}/>
						<Text style={{height: "10%"}}>#{friendData.name}</Text>
						{isMouseOver === index && isInvite < 0 && friendData.status === "Online" && !gameInvite.includes(friendData.name) ? <InviteButton onClick={() => handleInvite(index)}>Invite</InviteButton> :
						<div style={{height: "20%"}}><Text style={{fontSize: "1.3vw", marginTop: friendRequest.length > 0 ? "0.65vh" : "1vh"}}>{friendData.status}</Text></div>}
					</div>
					{isInvite === index ?
					<div style={{width: "100%", height: "50%", display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", textAlign: "center"}}>
						<Text>{isDifficulty ? "Difficulty" : "Game Option"}</Text>
						<StyledButton onClick={() => isDifficulty ? handleSpeed(friendData.name, "Easy") : handleOption(false)}>{isDifficulty ? "Easy" : "Simple"}</StyledButton>
						<StyledButton onClick={() => isDifficulty ? handleSpeed(friendData.name, "Medium") : handleOption(true)}>{isDifficulty ? "Medium" : "Double"}</StyledButton>
						<StyledButton style={{visibility: isDifficulty ? "visible" : "hidden", marginBottom: "0.5vh"}} onClick={() => handleSpeed(friendData.name, "Hard")}>Hard</StyledButton>
					</div> :
					<div style={{width: "100%", height: "50%", display: "flex", flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", textAlign: "center"}}>
						<StyledButton style={{width: "70%"}} onClick={() => handleShowCard(index)}>Show ID Card</StyledButton>
						<StyledLink to={"/chat"} onClick={() => handleChat(friendData.pfp, friendData.name, friendData.status)}>Chat</StyledLink>
						<StyledButton onClick={() => handleRemove(index)}>Remove</StyledButton>
						<StyledButton style={{width: "40%"}} onClick={() => handleBlock(index, true)}>Block</StyledButton>
					</div>}
				</Card>))}
				{!showMatchHistory && showIdCard && friendsData[userIdx] && friendsData[userIdx].name.length && <IdCard username={friendsData[userIdx].name} isLocal={false}/>}
				{showMatchHistory && <MatchHistory username={friendsData[userIdx].name}/>}
			</CardContainer>
			{warningType.type.length > 0 && warningType.component === "friends" && (isFriend && friendsData[userIdx] || (!isFriend && friendRequest[requestId])) && <Warning name={isFriend ? friendsData[userIdx]?.name : friendRequest[requestId].name} isFriendRequest={isFriend ? false : true}/>}
			<Footer>
			{!showMatchHistory && !showIdCard ?
				<>
					<StyledInput ref={searchRef} $isValid={searchInput.isValid} style={{border: `1px solid ${searchInput.isValid ? "dimgrey" : "lightgrey"}`}} type="text" name="search" autoComplete="off" placeholder={searchHolder} maxLength={10} value={searchInput.name} onChange={(e) => handleOnChange(true, e)} onKeyDown={(e) => handleKeyDown(true, e)}></StyledInput>
					<StyledInput ref={addRef} $isValid={addInput.isValid} style={{border: `1px solid ${addInput.isValid ? "dimgrey" : "lightgrey"}`}} type="text" name="add" autoComplete="off" placeholder={addHolder} maxLength={10} value={addInput.name} onChange={(e) => handleOnChange(false, e)} onKeyDown={(e) => handleKeyDown(false, e)}></StyledInput>
				</> :
				<CloseButton onClick={handleCloseCard} style={{width: showMatchHistory ? "16%" : "11%"}}>Hide {showMatchHistory ? "Match History " : "ID Card"}</CloseButton>}
			</Footer>
		</Container>);
}

export default Friends;
