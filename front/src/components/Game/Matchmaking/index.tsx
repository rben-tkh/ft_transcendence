import styled from "styled-components";
import Loader from "../../../utils/styles/Loader";
import { useContext, useEffect, useState } from "react";
import { GameContext } from "../../../utils/context/GameContext";
import { SoundContext } from "../../../utils/context/SoundContext";
import { ProfileContext } from "../../../utils/context/ProfileContext";
import Versus from '../../../assets/images/game/versus.png'
import { WebSocketContext } from "../../../utils/context/WebSocketContext";

const Card = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	height: 65%;
	width: 55%;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	text-align: center;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50, 0.95), rgb(25, 25, 25, 0.95));
`

const Element = styled.div`
	height: 100%;
	width: 32%;
	display: flex;
	flex-direction: column;
	justify-content: space-evenly;
	align-items: center;
	text-align: center;
`

const Infos = styled.div`
	height: 30%;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
`

const Title = styled.p`
	font-size: 2vw;
	margin: 0.2vh;
`

const SubTitle = styled.p`
	font-size: 1.6vw;
	margin: 0.3vh;
`

const Text = styled.p`
	font-size: 1.3vw;
	margin: 0.3vh;
`

const Dots = styled.div`
	width: 2%;
	font-size: 1.4vw;
	margin: 0vw;
	position: fixed;
	top: 54%;
	left: 93%;
	transform: translate(-75%, -50%);
	text-align: start;
`

const Cancel = styled.button`
	height: 35%;
	width: 70%;
	font-size: 1.2vw;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

function Matchmaking(props: {time: string})
{
	const { setStatus, name, nameDisplay, pfp, achievements, badgeIdx } = useContext(ProfileContext);
	const { dataGame, setDataGame, dataOpponent, userSimpleStat, userDoubleStat } = useContext(GameContext);
	const { socket } = useContext(WebSocketContext);
	const { handleSFX } = useContext(SoundContext);
	const dots = ["", ".", "..", "...", "..", "."];
	const [dotsIdx, setDotsIdx] = useState(0);

	const handleCancel = () => {
		socket.emit('cancelQueue');
		if (dataGame.id === undefined && dataGame.opponent !== undefined)
			socket.emit('updateInvite', name, dataGame.opponent, "Canceled", null);
		setDataGame({mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
		handleSFX("goBack");
		setStatus("Online");
	}
	useEffect(() => {
		const dotsInterval = setInterval(() => {
			setDotsIdx((prevIdx) => (prevIdx + 1) % 6);
		}, 600);
		return () => clearInterval(dotsInterval);
	}, []);
	return (<Card>
				<Element>
					<Infos>
						<img style={{height: "10vh", border: "1px solid dimgrey", borderRadius: "10px"}} src={pfp} alt="Me.png "/>
					</Infos>
					<Infos>
						<Title>{nameDisplay}</Title>
						<SubTitle>{dataGame.isDouble ? userDoubleStat.rank : userSimpleStat.rank}</SubTitle>
						<Text>{dataGame.isDouble ? userDoubleStat.rankRate : userSimpleStat.rankRate}RR</Text>
					</Infos>
					<Infos>
						<img style={{height: "8vh"}} src={achievements[badgeIdx + 1].picture} alt="UserAchivement.png"/>
						<Text style={{marginTop: "1.5vh"}}>{achievements[badgeIdx + 1].title}</Text>
					</Infos>
				</Element>
				<Element>
					<Infos>
						<Title>Game Option</Title>
						<SubTitle>{dataGame.isDouble ? "Double" : "Simple"}</SubTitle>
					</Infos>
					<Infos>
						{dataGame.id === undefined ? <Loader /> :
						<img style={{height: "17vh"}} src={Versus} alt="Versus.png"/>}
					</Infos>
					<Infos>
						<Title>Difficulty</Title>
						<SubTitle>{dataGame.speed === 1 ? "Easy" : dataGame.speed === 1.5 ? "Medium" : "Hard"}</SubTitle>
					</Infos>
				</Element>
				{dataGame.id === undefined ? 
				<Element>
					<Infos>
						<div style={{width: "40%", padding: "0.7vh 0.7vw 0.7vh 0.5vw", border: "1px solid darkgrey", borderRadius: "10px"}}>
							<Title>{props.time}</Title>
						</div>
					</Infos>
					<Infos>
						<SubTitle style={{width: "90%", margin: "0vw"}}>Waiting for {dataGame.opponent !== undefined ? dataGame.opponent : "opponent"}</SubTitle>
						{dataGame.opponent === undefined && <Dots>{dots[dotsIdx]}</Dots>}
					</Infos>
					<Infos>
						<Cancel onClick={handleCancel}>Cancel Queue</Cancel>
					</Infos>
				</Element> :
				<Element>
					<Infos>
						<img style={{height: "10vh", border: "1px solid dimgrey", borderRadius: "10px"}} src={dataOpponent.pfp}/>
					</Infos>
					<Infos>
						<Title>#{dataGame.opponent}</Title>
						<SubTitle>{dataOpponent.rank}</SubTitle>
						<Text>{dataOpponent.rankRate}RR</Text>
					</Infos>
					<Infos>
						<img style={{height: "8vh"}} src={achievements[dataOpponent.badgeIdx + 1].picture} alt="Badge.png"/>
						<Text style={{marginTop: "1.5vh"}}>{achievements[dataOpponent.badgeIdx + 1].title}</Text>
					</Infos>
				</Element>}
			</Card>);
}

export default Matchmaking;
