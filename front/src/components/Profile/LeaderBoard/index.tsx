import styled from "styled-components";
import { ChangeEvent, useContext, useState, useRef, RefObject, useEffect } from "react";
import { SoundContext } from "../../../utils/context/SoundContext";
import { ProfileContext } from "../../../utils/context/ProfileContext";
import axios from "axios";
import Loader from "../../../utils/styles/Loader";
import IdCard from "../../Profile/User/IdCard/";
import MatchHistory from "../MatchHistory";
import { WebSocketContext } from "../../../utils/context/WebSocketContext";

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: start;
`;

const LoaderContainer = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`

const CardContainer = styled.div<{$showIdCard: boolean}>`
	display: flex;
	flex-direction: column;
	width: 100%;
	justify-content: ${(props) => props.$showIdCard ? "center" : "start"};;
	align-items: ${(props) => props.$showIdCard ? "center" : "stretch"};
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
`

const Card = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-around;
	font-size: 1.5vh;
	padding: 2vh;
	margin: 1vh 2vw;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
`;

const Element = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	height: 100%;
	width: 10%;
`

const Text = styled.p`
	font-size: 1vw;
	margin: 0.1vw;
`

const StyledButton = styled.button`
	width: 100%;
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

const InputContainer = styled.div`
	width: 100%;
	height: 10%;
	display: flex;
	justify-content: center;
	align-items: center;
	border-top: 2px solid dimgrey;
	border-bottom-left-radius: 10px;
	border-bottom-right-radius: 10px;
	background: rgb(35, 35, 35, 0.95);
`

const StyledInput = styled.input<{$isValid: boolean}>`
	width: 100%;
	height: 50%;
	text-align: center;
	font-size: 2vh;
	border: ${(props) => props.$isValid ? "1px solid dimgrey" : "1px solid lightgrey"};
	border-radius: 10px;
	width: 50%;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
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

function LeaderBoard(props: {displayFriendCard: boolean, setDisplayFriendCard: (value: boolean) => void})
{
	const { headers } = useContext(WebSocketContext);
	const { achievements, showMatchHistory, setShowMatchHistory } = useContext(ProfileContext);
	const { handleSFX } = useContext(SoundContext);
	const [ playerInput, setPlayerInput ] = useState({name: '', isValid: true, inputChanged: true})
	const [ placeHolderMsg, setPlaceHolderMsg ] = useState('Search Player By #')
	const inputRef: RefObject<HTMLInputElement> = useRef(null);
	const [selectedCardIndex, setSelectedCardIndex] = useState<number>(-1);
	const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const [leaderboardData, setLeaderboardData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [ playerCard, setPlayerCard ] = useState("");

	const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPlayerInput({name: e.target.value, isValid: playerInput.isValid, inputChanged: true});
	}
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && playerInput.inputChanged && playerInput.name.length)
		{
			if (!leaderboardData.some(user => user.name === playerInput.name))
			{
				setPlayerInput({name: '', isValid: false, inputChanged: false});
				setPlaceHolderMsg(playerInput.name.length < 2 ? 'Username Too Short' : 'Player Not found');
				handleSFX("goBack");
			}
			else
			{
				const index = leaderboardData.findIndex(user => user.name === playerInput.name);
				setPlayerInput({name: '', isValid: true, inputChanged: false});
				if (inputRef.current)
					inputRef.current.blur();
				setPlaceHolderMsg('Search Player By #');
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
		}
	};
	const handleClick = async (username: string) => {
		setPlayerCard(username);
		props.setDisplayFriendCard(true)
		handleSFX('clic');
	}
	useEffect(() => {
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/game/leaderboard`, { headers })
		.then((response) => {
			if (response.status === 200)
			{
				const data = response.data.map((player) => {
					return {
						name: player.name,
						picture: player.pfp_url,
						simpleRank: player.simpleGameRank,
						doubleRank: player.doubleGameRank,
						win: player.simpleGameWin + player.doubleGameWin,
						lose: player.simpleGameLose + player.doubleGameLose,
						badgeIdx: player.badgeIdx,
						isPending: player.isPending
					};
				});
				const sortedData = data.sort((a: any, b: any) => b.win - a.win);
				setLeaderboardData(sortedData);
				setLoading(false);
			}
			else
				console.error('Failed to fetch leaderboard data:', response.status);
		}).catch((error) => {
				console.error('Error fetching leaderboard data:', error);
		});
	}, []);
	const handleCloseCard = () => {
		if (showMatchHistory)
			setShowMatchHistory(false);
		else
		{
			setPlayerCard("");
			props.setDisplayFriendCard(false)
		}
		handleSFX('goBack');
	}
	useEffect(() => {
		if (!props.displayFriendCard)
		{
			props.setDisplayFriendCard(false);
			setPlayerCard("");
			setShowMatchHistory(false);
		}
	}, [props.displayFriendCard])
	return (loading ? <LoaderContainer><Loader /></LoaderContainer> : 
			<Container style={playerCard.length && !showMatchHistory ? {alignItems: "center"} : {}}>
				{playerCard.length && !showMatchHistory ? <CardContainer $showIdCard={true}><IdCard username={playerCard} isLocal={false} isPending={leaderboardData.find((player) => player.name === playerCard).isPending} /></CardContainer> :
					showMatchHistory ? <CardContainer $showIdCard={false}><MatchHistory username={playerCard}/></CardContainer> :
				<CardContainer $showIdCard={false}>
					{leaderboardData.map((user, index) => (
					<Card key={index} ref={(ref) => cardRefs.current[index] = ref} style={{marginTop: index ? "0vh" : "", border: selectedCardIndex === index ? "2px solid lightgrey" : "2px solid dimgrey"}}>
						<Element style={{width: "5%"}}>
							<Text style={{fontSize: "2vw"}}>{index + 1}</Text>
						</Element>
						<Element style={{width: "10%"}}>
							<img style={{objectFit: "cover", height: "8.6vh", width: "100%", border: "1px solid dimgrey", borderRadius: "10px"}} src={user.picture} alt="Picture.png"/>
						</Element>
						<Element style={{width: "15%"}}>
							<Text style={{fontSize: "1.4vw"}}>#{user.name}</Text>
						</Element>
						<Element style={{width: "10%"}}>
							<Text style={{fontSize: "1.2vw"}}>Simple</Text>
							<Text>{user.simpleRank}</Text>
						</Element>
						<Element style={{width: "10%"}}>
							<Text style={{fontSize: "1.4vw"}}>Ratio</Text>
							<Text style={{fontSize: "1.2vw"}}>{user.win}W/{user.lose}L</Text>
						</Element>
						<Element style={{width: "10%"}}>
							<Text style={{fontSize: "1.2vw"}}>Double</Text>
							<Text>{user.doubleRank}</Text>
						</Element>
						<Element style={{width: "15%", justifyContent: "space-between"}}>
							<img style={{height: "6vh"}} src={achievements[user.badgeIdx + 1].picture} alt="achievement.png"/>
							<Text style={{ height: "15%", fontSize: "0.9vw"}}>{achievements[user.badgeIdx + 1].title}</Text>
						</Element>
						<Element style={{marginRight: "2vw", width: "12%"}}>
							<StyledButton onClick={() => handleClick(user.name)}>Show ID Card</StyledButton>
						</Element>
					</Card>))}
				</CardContainer>}
				<InputContainer>
				{playerCard.length ?
					<CloseButton onClick={handleCloseCard} style={{width: showMatchHistory ? "16%" : "11%"}}>Hide {showMatchHistory ? "Match History " : "ID Card"}</CloseButton> :
					<StyledInput ref={inputRef} $isValid={playerInput.isValid} type="text" name="search" autoComplete="off" placeholder={placeHolderMsg} maxLength={10} value={playerInput.name} onChange={handleOnChange} onKeyDown={handleKeyDown}></StyledInput>}
				</InputContainer>
			</Container>);
}

export default LeaderBoard;
