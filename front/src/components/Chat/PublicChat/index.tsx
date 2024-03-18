import { NodeJS } from 'node';
import { RefObject, useContext, useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import Banner from '../Banner/';
import { SoundContext } from '../../../utils/context/SoundContext';
import { ChatContext } from '../../../utils/context/ChatContext';
import { WebSocketContext } from '../../../utils/context/WebSocketContext';
import { ProfileContext } from '../../../utils/context/ProfileContext';
import axios from 'axios';
import Warning from '../../../assets/images/chat/warning.svg';
import Loader from '../../../utils/styles/Loader';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	width: 75%;
	height: 100%;
`;

const List = styled.div`
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
`

const LoaderContainer = styled.div`
	height: 80%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`

const NoConv = styled.p`
	font-size: 2vw;
	font-weight: 600;
	text-align: center;
	margin: auto;
`

const Card = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	padding: 1vh;
	margin: 0.75vh 1vw;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
`;

const Element = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	text-align: center;
	height: 100%;
`

const PassField = styled.div`
	display: flex;
	justify-content: start;
	align-items: center;
	width: 100%;
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

const StyledButton = styled.button`
	font-size: 1.2vw;
	padding: 0.6vh 0.4vw;
	margin: auto;
	border: 1px solid dimgrey;
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

function PublicChat(props: {tab: string})
{
	const { socket, headers } = useContext(WebSocketContext);
	const { handleSFX } = useContext(SoundContext);
	const { name } = useContext(ProfileContext);
	const { handleSVG, chatList } = useContext(ChatContext);
	const [ showInput, setShowInput ] = useState<number>(-1);
	const [ showPass, setShowPass ] = useState<boolean>(false);
	const [ password, setPassword ] = useState<string>('');
	const [ isValid, setIsValid ] = useState<boolean>(true);
	const [ inputHolder, setInputHolder ] = useState('Password');
	const inputRef: RefObject<HTMLInputElement> = useRef(null);
	const [ isDeleted, setIsDeleted ] = useState<string[]>([]);
	const [ isFull, setIsFull] = useState<string[]>([]);
	const [ loading, setLoading ] = useState<boolean>(true);
	const [ groups, setGroups ] = useState<{pfp: string, name: string, description: string, nbUser: number, capacity: number, needPass: boolean}[]>([]);

	const handleMouseLeave = () => {
		setShowInput(-1);
		setShowPass(false);
		setPassword('');
		setIsValid(true);
		setInputHolder('Password');
	}
	const handleClick = async (index: number, groupName: string, needPass: boolean) => {
		if (needPass && showInput < 0)
		{
			setShowInput(index);
			handleSFX("clic");
		}
		else if (needPass && password.length < 4)
		{
			setPassword('');
			setInputHolder("Password Too Short");
			setIsValid(false);
			handleSFX("goBack");
		}
		else 
		{
			axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/joinGroup', { params: { groupName: groupName, password: needPass ? password : undefined }, headers })
			.then((response) => {
				if (typeof response.data !== "string")
				{
					socket.emit('joinRoom', response.data.pfp, true, name, groupName, response.data.capacity);
					setIsValid(true);
					handleSFX("clic");
				}
				else
				{
					if (response.data === "deleted")
						setIsDeleted([...isDeleted, groupName]);
					else if (response.data === "full")
						setIsFull([...isFull, groupName]);
					setPassword('');
					setInputHolder(response.data);
					setIsValid(false);
					handleSFX("goBack");
				}
			}).catch((error) => {
				console.error(error);
			});
		}
	}
	const handleEyePass = () => {
		setShowPass(!showPass)
		showPass ? handleSFX("goBack") : handleSFX("clic");
	}
	useEffect(() => {
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/all-groups', { headers })
		.then((response: any) => {
			setGroups(response.data);
			setLoading(false);
		}).catch ((error) => {
			console.error(error);
		});
	}, []);
	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (isDeleted.length)
		{
			timeoutId = setTimeout(() => {
				setGroups((prevState: any) => prevState.filter((group: any) => !isDeleted.includes(group.name)));
				setIsDeleted([]);
			}, 3000);
		}
		return () => clearTimeout(timeoutId);
	}, [isDeleted]);
	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (isFull.length)
			timeoutId = setTimeout(() => setIsFull([]), 3000);
		return () => clearTimeout(timeoutId);
	}, [isFull]);
	return (<Container>
				<Banner type={props.tab}/>
				{loading ? <LoaderContainer><Loader /></LoaderContainer> : <List>
					{!groups.filter((group: any) => !chatList.some((item: any) => group.name === item.name)).length && <NoConv>No Group Yet.</NoConv>}
					{groups.length > 0 && groups.filter((group: any) => !chatList.some((chatItem: any) => chatItem.name === group.name)).map((group, index) => (
					<Card key={index} onMouseLeave={handleMouseLeave} style={{marginTop: !index ? "0.75vh" : "0"}}>
						{!isDeleted.includes(group.name) && !isFull.includes(group.name) ? <><Element style={{flexDirection: "column", width: "7%"}}>
							<img src={group.needPass ? handleSVG("private") : handleSVG("public")} alt={group.needPass ? "Private.svg" : "Public.svg"} style={{height: "2.5vh", margin: "0.25vh"}}/>
							<p style={{fontSize: "1vw", margin: "0.25vh"}}>{group.needPass ? "Private" : "Public"}</p>
						</Element>
						<Element style={{width: "15%"}}>
							<img src={group.pfp} alt="Picture.png" style={{objectFit: "cover", height: "100%", width: "57%", borderRadius: "10px", border: "1px solid dimgrey"}} />
						</Element>
						<Element style={{width: "15%"}}>
							<p style={{fontSize: "1.4vw", margin: "auto"}}>{group.name}<br /></p>
						</Element>
						{group.needPass && showInput === index ?
						<Element style={{width: "50%"}}>
							<PassField style={{ border: `1px solid ${isValid ? "dimgrey" : "lightgrey"}`}}>
								<Password ref={inputRef} $isValid={isValid} type={showPass ? 'text' : 'password'} name='password' autoComplete="off" placeholder={inputHolder} maxLength={30} value={password} onChange={(e) => setPassword(e.target.value)}/>
								<EyePass style={{padding: showPass ? "0.5vh 0.25vw" : "0.5vh 0.3vw", borderLeft: `1px solid ${isValid ? "dimgrey" : "lightgrey"}`}} src={showPass ? handleSVG("hidePass") : handleSVG("showPass")} alt={showPass ? "ShowPass.svg" : "HidePass.svg"} onClick={handleEyePass}/>
							</PassField>
						</Element> :
						<>
							<Element style={{fontSize: "1vw", width: "40%", marginLeft: '1vw'}}>
								<p style={{ overflowWrap: "break-word", maxWidth: "93%", margin: "auto"}}>{group.description}</p>
							</Element>
							<Element style={{width: "10%", marginLeft: '-1.2vw'}}>
								<p style={{ fontSize: "1.3vw", margin: "auto"}}>{group.nbUser} / {group.capacity}</p>
							</Element>
						</>}
						<Element style={{width: "10%"}}>
							<StyledButton onClick={() => handleClick(index, group.name, group.needPass)}>Join</StyledButton>
						</Element></> :
						<Element style={{width: "100%"}}>
							<img style={{height: "4vh"}} src={Warning} alt="Warning.svg"/>
							<p style={{fontSize: "1.2vw", marginLeft: "1.5vw"}}>Sorry, {group.name} {isDeleted.includes(group.name) ? "has been deleted" : "is actually full"}.</p>
						</Element>}
					</Card>))}
				</List>}
			</Container>);
}

export default PublicChat;
