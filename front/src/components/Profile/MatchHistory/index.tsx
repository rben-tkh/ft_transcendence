import styled from "styled-components";
import { ChangeEvent, useContext, useState, useRef, useEffect } from "react";
import { ProfileContext } from "../../../utils/context/ProfileContext";
import { WebSocketContext } from "../../../utils/context/WebSocketContext";
import axios from "axios";
import Loader from "../../../utils/styles/Loader";

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: start;
`;

const CardContainer = styled.div<{$isLoaded: boolean}>`
	display: flex;
	flex-direction: column;
	justify-content: ${(props) => props.$isLoaded ? "start" : "center"};
	align-items: ${(props) => props.$isLoaded ? "" : "center"};
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
`

const NoConv = styled.p`
	font-size: 1.7vw;
	font-weight: 600;
	text-align: center;
	margin: auto;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 55vh;
`

const Card = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-around;
	padding: 1.5vh;
	margin: 1vh 2vw;
	font-size: 1.5vh;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
	position: relative;
`;

const Element = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	width: 14%;
`

const Text = styled.p`
	font-size: 1vw;
	margin: 0.1vw;
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

const StyledInput = styled.input`
	width: 100%;
	height: 50%;
	text-align: center;
	font-size: 2vh;
	border: 1px solid dimgrey;
	border-radius: 10px;
	width: 50%;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
`

function MatchHistory(props: {username: string})
{
	const { headers, token } = useContext(WebSocketContext);
	const { logged, showMatchHistory } = useContext(ProfileContext);
	const [ playerInput, setPlayerInput ] = useState({name: '', isValid: true, inputChanged: true})
	const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
	const [ matchsData, setMatchsData ] = useState([]);
	const [ updatedMatchs, setUpadtedMatchs ] = useState([]);
	const [ loaded, setLoaded ] = useState(false);
	const [ userData, setUserData ] = useState({nameDisplay: '', pfp: ''});

	const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPlayerInput({name: e.target.value, isValid: playerInput.isValid, inputChanged: true});
	}
	useEffect(() => {
		if (matchsData.length)
			setUpadtedMatchs(matchsData.filter((user: any) => user.opponent.name.slice(0, playerInput.name.length) === playerInput.name))
	}, [playerInput.name]);
	useEffect(() => {
		const fetchMatchsData = async () => {
			const matchsRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/game/get-match-history', { params: { name: props.username}, headers })
			if (matchsRes.data)
			{
				setMatchsData(matchsRes.data);
				setUpadtedMatchs(matchsRes.data);
				axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getUserData`, { params: { name: props.username}, headers })
				.then((response: any) => {
					setUserData(response.data);
					setLoaded(true);
				})
				.catch(error => console.error('Error:', error));
			}
		}
		if (token && logged)
			fetchMatchsData();
	}, []);

	return (<Container>
				<CardContainer $isLoaded={loaded}>
					{!loaded && <Loader />}
					{loaded && !updatedMatchs.length && !playerInput.name.length && <NoConv>No match yet.</NoConv>}
					{loaded && !updatedMatchs.length && playerInput.name.length > 0 && <NoConv>No match found.</NoConv>}
					{loaded && updatedMatchs.length > 0 && updatedMatchs.map((match, index) => (
					<Card key={index} ref={(ref) => cardRefs.current[index] = ref} style={{marginTop: index ? "0vh" : ""}}>
						<Element>
							<img style={{objectFit: "cover", height: "8vh", width: "50%", borderRadius: "10px", border: "1px solid dimgrey", height: '8vh'}} src={userData.pfp}/>
						</Element>
						<Element style={{width: "15%"}}>
							<Text style={{fontSize: '1.4vw'}}>{userData.nameDisplay}</Text>
							<Text>{match.rankRate}RR</Text>
						</Element>
						<Element>
							<Text style={{fontSize: '1.2vw'}}>Game Option</Text>
							<Text>{match.mode}</Text>
						</Element>
						<Element style={{width: "10%"}}>
							<Text style={{fontSize: '1.2vw'}}>{match.winner ? "Victory" : "Defeat"}</Text>
							<Text style={{fontSize: '1.4vw'}}>{match.score_x} - {match.score_y}</Text>
							<Text style={{fontSize: '0.8vw'}}>{match.date}</Text>
						</Element>
						<Element>
							<Text style={{fontSize: '1.2vw'}}>Difficulty</Text>
							<Text>{match.difficulty}</Text>
						</Element>
						<Element style={{width: "15%"}}>
							<Text style={{fontSize: '1.4vw'}}>#{match.opponent.name}</Text>
							<Text>{match.opponentRR}RR</Text>
						</Element>
						<Element>
							<img style={{objectFit: "cover", height: "8vh", width: "50%", borderRadius: "10px", border: "1px solid dimgrey", height: '8vh'}} src={match.opponent.pfp_url}/>
						</Element>
					</Card>))}
				</CardContainer>
				{loaded &&
				<InputContainer style={{display: showMatchHistory ? "none" : "flex"}}>
					<StyledInput type="text" name="search" autoComplete="off" placeholder='Search Player By #' maxLength={10} value={playerInput.name} onChange={handleOnChange}/>
				</InputContainer>}
			</Container>);
}

export default MatchHistory;
