import styled from "styled-components";
import { useContext, useEffect } from "react";
import { GameContext } from '../../../utils/context/GameContext'
import { WebSocketContext } from '../../../utils/context/WebSocketContext';
import { ProfileContext } from "../../../utils/context/ProfileContext";

const Overlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: rgba(0, 0, 0, 0.6);
	z-index: 10;
`;

const Card = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 45%;
	height: 40%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50), rgb(25, 25, 25));
	font-size: 3vh;
	margin-bottom: 50px;
	z-index: 12;
`;

const Title = styled.p`
	font-size: 4vh;
	margin: 0.5vh;
`

const Text = styled.p`
	font-size: 3vh;
	margin: 2vh;
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

function Pause()
{
	const { name, setStatus } = useContext(ProfileContext);
	const { dataGame, scores, setScores, setTargetState, gamePaused, setGamePaused } = useContext(GameContext);
	const { socket } = useContext(WebSocketContext);

	const handleGiveUp = () => {
		if (dataGame.mode === "Online")
			socket.emit('resignGame', dataGame.id, name);
		setScores({x: scores.x, y: 11});
		setTargetState("visible");
		setStatus("In Postmatch");
		setGamePaused(null);
	}
	const handleGoBack = () => {
		if (dataGame.mode === 'Online')
			socket.emit('endPause', dataGame.id);
		else
			setGamePaused(null);
	}
	useEffect(() => {
		if (dataGame.mode === 'Online' && gamePaused === "header")
		{
			const timeoutId = setTimeout(() => {
				socket.emit('resignGame', dataGame.id, name);
				setScores({x: scores.x, y: 11});
				setStatus("In Postmatch");
				setGamePaused(null);
			}, 60000);
			return () => clearTimeout(timeoutId);
		}
	}, [gamePaused]);
	return (<Overlay><Card>
				{gamePaused === "waiting" && <Title style={{fontSize: "5vh"}}>Pause</Title>}
				{gamePaused !== "waiting" && <Title>Game In Progress</Title>}
				{gamePaused !== "waiting" && <Title>Scores: {scores.x} - {scores.y}</Title>}
				{gamePaused === "waiting" && <Text>Please wait a moment.<br />{gamePaused === "waiting" ? "Your opponent" : "A Player"} has temporarily interrupted the game.<br />Note that after one minute, this will be considered an automatic abandonment.</Text>}
				{((dataGame.mode !== "Online" && gamePaused === "header") || gamePaused === "leave") && <Text>{gamePaused === "leave" ? "Are you sure" : "Do you want"} to leave the game ?</Text>}
				{(dataGame.mode === "Online" && gamePaused === "header") && <Text>You have 1 minute to return, otherwise,<br />you will be considered to have abandoned the game.</Text>}
				{gamePaused !== "waiting" && <ButtonContainer>
					<StyledButton onClick={handleGiveUp}>{((dataGame.mode !== "Online" && gamePaused === "header") || gamePaused === "leave") ? "Yes" : "Give up"}</StyledButton>
					<StyledButton onClick={handleGoBack}>{((dataGame.mode !== "Online" && gamePaused === "header") || gamePaused === "leave") ? "No" : "I'm back"}</StyledButton>
				</ButtonContainer>}
			</Card></Overlay>);
}

export default Pause;
