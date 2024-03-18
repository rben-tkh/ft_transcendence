import { NodeJS } from 'node';
import styled from "styled-components";
import CreateInfo from '../CreateInfo'
import { useContext, useEffect, useState, useRef, RefObject, ChangeEvent } from "react";
import { SoundContext } from "../../../utils/context/SoundContext";
import { ChatContext } from "../../../utils/context/ChatContext";
import axios from 'axios';
import { ProfileContext } from "../../../utils/context/ProfileContext";
import GroupPfp from '../../../assets/images/chat/groupLogo.png'
import { WebSocketContext } from "../../../utils/context/WebSocketContext";

const Container = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	border-bottom: 2px solid dimgrey;
	padding: 1vh 0vw;
	height: 10%;
	width: 100%;
	background: rgb(35, 35, 35, 0.95);
`

const StyledForm = styled.form`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	text-align: center;
`

const StyledInput = styled.input<{$isValid: boolean}>`
	height: 45%;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border: 1px solid dimgrey;
	border-radius: 10px;
	width: 93.270%;
	font-size: 2vh;
	margin: 10px;
	text-align: center;
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`

const GroupName = styled.input<{$isValid: boolean}>`
	width: 17%;
	margin: auto;
	margin-right: 0%;
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
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	border: 1px solid dimgrey;
	border-radius: 10px;
	font-size: 1vw;
	text-align: center;
	&::-webkit-input-placeholder {
		color: ${(props) => props.$isValid ? 'default' : 'darkgrey'};
	}
`;

const Description = styled.input<{$isValid: boolean}>`
	width: 82%;
	margin-top: 1vh;
	margin-left: 0.5vw;
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
	font-size: 0.8vw;
	padding: 1vh 0.5vw;
	margin: auto;
	margin-right: 1vw;
	border: 1px solid rgb(75, 75, 75, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

const Info = styled.button`
	height: 3vh;
	width: 1.6vw;
	margin-right: 1vw;
	font-size: 1vw;
	border: 1px solid rgba(255, 255, 255, 0.2);
	border-radius: 100%;
	cursor: pointer;
	background: transparent;
	&:hover{background: rgba(255, 255, 255, 0.2);}
	&:active{background: rgba(255, 255, 255, 0.5);}
	transition: background-color 200ms ease-in-out;
`

interface FormData {
	pfp: string;
	name: string;
	password: string;
	capacity: number | string;
	description: string;
}

function Banner(props: {type: string})
{
	const { name, pfp, friendsData } = useContext(ProfileContext);
	const { handleSFX } = useContext(SoundContext);
	const { handleSVG, chatList, setChatList, setTalk, setTalkSearched, setRefreshFriends } = useContext(ChatContext);
	const { headers, socket } = useContext(WebSocketContext); 
	const [formData, setFormData] = useState<FormData>({pfp: GroupPfp, name: '', password: '', capacity: 0, description: ''});
	const [formHolder, setFormHolder] = useState<FormData>({name: 'Group Name', password: 'Password', capacity: 'Capacity', description: 'Description'});
	const [isValid, setIsValid] = useState({name: true, password: true, capacity: true, description: true});
	const [showPass, setShowPass] = useState(false);
	const [grpInfo, setGrpInfo] = useState(false);
	const [ searchInput, setSearchInput ] = useState({name: '', isValid: true, isChanged: true})
	const [ addInput, setAddInput ] = useState({name: '', isValid: true, isChanged: true})
	const searchRef: RefObject<HTMLInputElement> = useRef(null);
	const addRef: RefObject<HTMLInputElement> = useRef(null);
	const [ searchHolder, setSearchHolder ] = useState('Search Talk');
	const [ addHolder, setAddHolder ] = useState('Add Friend By #');

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};
	const handleOnChange = (isSearch: boolean, e: ChangeEvent<HTMLInputElement>) => {
		if (isSearch)
			setSearchInput({name: e.target.value, isValid: searchInput.isValid, isChanged: true});
		else
			setAddInput({name: e.target.value, isValid: addInput.isValid, isChanged: true});
	}
	const handleKeyDown = async (isSearch: boolean, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter')
		{
			if (isSearch && !chatList.some(user => user.name === searchInput.name) && !friendsData.some(user => user.name === searchInput.name) && searchInput.isChanged && searchInput.name.length)
			{
				setSearchInput({name: '', isValid: false, isChanged: false});
				setSearchHolder(searchInput.name.length < 2 ? 'Talkname Too Short' : 'Talk Not found');
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
				const chat = chatList.find(user => user.name === searchInput.name);
				if (chat === undefined)
				{
					const friend = friendsData.find(user => user.name === searchInput.name);
					if (friend === undefined)
					{
						setSearchInput({name: '', isValid: false, isChanged: false});
						setSearchHolder('Search Talk');
						handleSFX("goBack");
						return ;
					}
					setTalk({pfp: friend.pfp, name: friend.name, status: friend.status, isGroup: false});
					chatList.unshift({pfp: friend.pfp, name: friend.name, status: friend.status, isGroup: false});
					setChatList([...chatList]);
				}
				else
					setTalk({pfp: chat.pfp, name: chat.name, isGroup: true, isOwner: chat.isOwner});
				setSearchInput({name: '', isValid: true, isChanged: false});
				if (searchRef.current)
					searchRef.current.blur();
				setSearchHolder('Search Talk');
				setTalkSearched(true);
				handleSFX("clic");
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
							socket.emit('addFriend', addInput.name, name, pfp);
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
	const handleSubmit = async (event: React.FormEvent, isJoin: boolean) => {
		event.preventDefault();
		const response = await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/checkRoom', { formData, isJoin }, { headers });
		if (typeof response.data.capacity === "number")
		{
			socket.emit('joinRoom', response.data.pfp, isJoin, name, formData.name, response.data.capacity);
			setFormData({pfp: GroupPfp, name: '', password: '', capacity: 0, description: ''});
			setFormHolder({name: 'Group Name', password: 'Password', capacity: 'Capacity', description: 'Description'});
			setIsValid({name: true, password: true, capacity: true, description: true});
			handleSFX('clic');
		}
		else
		{
			if (response.data.name !== "ok" || (isJoin && response.data.capacity !== "ok"))
			{
				if (isJoin && response.data.capacity !== "ok")
					setFormHolder((prevState) => ({ ...prevState, name: response.data.capacity}));
				else
					setFormHolder((prevState) => ({ ...prevState, name: response.data.name}));
				setFormData((prevState) => ({ ...prevState, name: '' }));
				setIsValid((prevState) => ({ ...prevState, name: false }));
			}
			else
			{
				setFormHolder((prevState) => ({ ...prevState, name: "Group Name"}));
				setIsValid((prevState) => ({ ...prevState, name: true }));
			}
			if (response.data.password !== "ok")
			{
				setFormHolder((prevState) => ({ ...prevState, password: response.data.password }));
				setFormData((prevState) => ({ ...prevState, password: '' }));
				setIsValid((prevState) => ({ ...prevState, password: false }));
			}
			else
			{
				setFormHolder((prevState) => ({ ...prevState, password: 'Password' }));
				setIsValid((prevState) => ({ ...prevState, password: true }));
			}
			if (response.data.capacity !== "ok")
			{
				setFormHolder((prevState) => ({ ...prevState, capacity: response.data.capacity }));
				setIsValid((prevState) => ({ ...prevState, capacity: false }));
			}
			else
				setIsValid((prevState) => ({ ...prevState, capacity: true }));
			if (response.data.description !== "ok")
			{
				setFormHolder((prevState) => ({ ...prevState, description: response.data.description }));
				setFormData((prevState) => ({ ...prevState, description: '' }));
				setIsValid((prevState) => ({ ...prevState, description: false }));
			}
			else
			{
				setFormHolder((prevState) => ({ ...prevState, description: 'Description' }));
				setIsValid((prevState) => ({ ...prevState, description: true }));
			}
			handleSFX('goBack');
		}
	};
	const handleEyePass = () => {
		setShowPass(!showPass)
		showPass ? handleSFX("goBack") : handleSFX("clic");
	}
	const handleInfo = () => {
		setGrpInfo(true);
		handleSFX('clic');
	}
	useEffect(() => {
		setFormHolder({name: 'Group Name', password: 'Password', capacity: 'Capacity', description: 'Description'});
		setFormData({ pfp: GroupPfp, name: '', password: '', capacity: 0, description: '' });
		setIsValid({ name: true, password: true, capacity: true, description: true });
		setSearchInput({name: '', isValid: true, isChanged: true});
		setAddInput({name: '', isValid: true, isChanged: true});
		setSearchHolder('Search Talk');
		setAddHolder('Add Friend By #');
	}, [props.type]);
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
	return (<Container>
				{props.type === "search" && <StyledInput $isValid={searchInput.isValid} ref={searchRef} style={{border: `1px solid ${searchInput.isValid ? "dimgrey" : "lightgrey"}`}} type="text" name="search" autoComplete="off" placeholder={searchHolder} maxLength={10} value={searchInput.name} onChange={(e) => handleOnChange(true, e)} onKeyDown={(e) => handleKeyDown(true, e)}></StyledInput>}
				{props.type === "add" && <StyledInput $isValid={addInput.isValid} ref={addRef} style={{border: `1px solid ${addInput.isValid ? "dimgrey" : "lightgrey"}`}} type="text" name="add" autoComplete="off" placeholder={addHolder} maxLength={10} value={addInput.name} onChange={(e) => handleOnChange(false, e)} onKeyDown={(e) => handleKeyDown(false, e)}></StyledInput>}
				{props.type === "create" && <StyledForm onSubmit={(event) => handleSubmit(event, false)} method="get" action="" noValidate>
					<div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "100%", height: "100%"}}>
						<div style={{display: "flex", alignItems: "center", width: "100%", height: "100%"}}>
							<GroupName $isValid={isValid.name} type='text' name='name' value={formData.name} autoComplete="off" placeholder={formHolder.name} maxLength={10} onChange={handleInputChange} onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault()}} style={{ border: `1px solid ${isValid.name ? "dimgrey" : "lightgrey"}`}} required/>
							<PassField style={{ border: `1px solid ${isValid.password ? "dimgrey" : "lightgrey"}`}}>
								<Password $isValid={isValid.password} type={showPass ? 'text' : 'password'} name='password' value={formData.password} autoComplete="off" placeholder={formHolder.password} maxLength={30} onChange={handleInputChange} onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault()}} />
								<EyePass style={{padding: showPass ? "0.5vh 0.25vw" : "0.5vh 0.3vw", borderLeft: `1px solid ${isValid.password ? "dimgrey" : "lightgrey"}`}} onClick={handleEyePass} src={showPass ? handleSVG("hidePass") : handleSVG("showPass")} alt={showPass ? "ShowPass.svg" : "HidePass.svg"}/>
							</PassField>
							<Capacity $isValid={isValid.capacity} type='number' name='capacity' value={!formData.capacity ? '' : formData.capacity} autoComplete="off" placeholder={formHolder.capacity.toString()} min={2} max={10} onChange={handleInputChange} onKeyDown={(e) => e.preventDefault()} style={{caretColor: "transparent", border: `1px solid ${isValid.capacity ? "dimgrey" : "lightgrey"}`}}></Capacity>
						</div>
						<Description $isValid={isValid.description} type='text' name='description' value={formData.description} autoComplete="off" placeholder={formHolder.description} maxLength={50} onChange={handleInputChange} onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault()}} style={{border: `1px solid ${isValid.description ? "dimgrey" : "lightgrey"}`}}/>
					</div>
					<Confirm type="submit">Create</Confirm>
				</StyledForm>}
				{props.type === "create" && <Info onClick={handleInfo}>?</Info>}
				{props.type === "create" && grpInfo && <CreateInfo setInfo={setGrpInfo}/>}
				{props.type === "join" && <StyledForm onSubmit={(event) => handleSubmit(event, true)} method="get" action="" style={{height: "100%", width: "90%"}} noValidate>
					<div style={{display: "flex", alignItems: "center", width: "90%", height: "100%"}}>
						<GroupName $isValid={isValid.name} type='text' name='name' value={formData.name} autoComplete="off" placeholder={formHolder.name} maxLength={10} onChange={handleInputChange} onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault()}} style={{ height: "45%", width: "40%", border: `1px solid ${isValid.name ? "dimgrey" : "lightgrey"}`}} required/>
						<PassField style={{ height: "45%", width: "55%", border: `1px solid ${isValid.password ? "dimgrey" : "lightgrey"}`}}>
							<Password $isValid={isValid.password} type={showPass ? 'text' : 'password'} name='password' value={formData.password} autoComplete="off" placeholder={formHolder.password} maxLength={30} onChange={handleInputChange} onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault()}} />
							<EyePass style={{padding: showPass ? "0.65vh 0.25vw" : "0.65vh 0.3vw", borderLeft: `1px solid ${isValid.password ? "dimgrey" : "lightgrey"}`}} onClick={handleEyePass} src={showPass ? handleSVG("hidePass") : handleSVG("showPass")} alt={showPass ? "ShowPass.svg" : "HidePass.svg"}/>
						</PassField>
					</div>
					<Confirm type="submit" style={{marginLeft: "1vw"}}>Join</Confirm>
				</StyledForm>}
			</Container>)
}

export default Banner;
