import { useContext, useState, useEffect, useMemo } from 'react';
import { GameContext } from '../../../utils/context/GameContext'
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ProfileContext } from '../../../utils/context/ProfileContext';
import { SoundContext } from '../../../utils/context/SoundContext';
import { WebSocketContext } from '../../../utils/context/WebSocketContext';
import { ChatContext } from '../../../utils/context/ChatContext';

const Card = styled.div`
	position: fixed;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 65%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
	border: 2px solid dimgrey;
	border-radius: 5px;
	background: linear-gradient(0.5turn, rgb(50, 50, 50), rgb(25, 25, 25));
	z-index: 12;
`

const Summary = styled.div`
	width: 100%;
	display: grid;
	grid-template-columns: 33% 33% 33%;
	grid-template-rows: 30% 35% 20% 10%;
	align-items: center;
	justify-content: center;
`;

const Element = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	text-align: center;
`

const Title = styled.p`
	font-size: 2vw;
	margin: 0.5vh;
	white-space: pre-wrap;
`

const SubTitle = styled.p`
	font-size: 1.8vw;
	margin: 0.5vh;
`

const Text = styled.p`
	font-size: 1.3vw;
	margin: 0.5vh;
`

const ProgressBar = styled.progress`
	height: 1.5vh;
	width: 85%;
	border: 1px solid grey;
	border-radius: 10px;
	&::-webkit-progress-bar {
		border-radius: 10px;
		background-color: dimgrey;
	}
	&::-moz-progress-bar {
		border-radius: 10px;
		background-color: dimgrey;
	}
	&::-webkit-progress-value {
		background-color: lightgrey;
		border-radius: 8px;
		transition: width 0.7s linear;
	}
	&::-moz-progress-bar-value {
		background-color: lightgrey;
		border-radius: 8px;
		transition: width 0.7s linear;
	}
`

const Achievement = styled.div`
	width: 100%;
	height: 25%;
	display: flex;
	align-items: center;
	justify-content: space-evenly;
	border-top: 2px solid dimgrey;
	margin-bottom: 1vh;
`

const EndButton = styled.div`
	height: 15%;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-evenly;
	border-top: 2px solid dimgrey;
`

const StyledButton = styled.button`
	height: 50%;
	width: 20%;
	font-size: 1vw;
	border: 1px solid rgb(70, 70, 70, 0.95);
	border-radius: 5px;
	cursor: pointer;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`


function EndGame(props: {time: string})
{
	const { handleSFX } = useContext(SoundContext);
	const { socket } = useContext(WebSocketContext);
	const { fetchGameInvite } = useContext(ChatContext);
	const { prevBadges, setPrevBadges, isAmical } = useContext(GameContext);
	const { name, setStatus, achievements, userAchievement } = useContext(ProfileContext);
	const badgeToUnlock = achievements.slice(1).filter((badge: any) => !userAchievement.includes(badge.index));
	const newBadges = useMemo(() => {
		if (userAchievement.length > prevBadges.length)
		{
			const newBadgeIdx = userAchievement.filter((index: number) => !prevBadges.includes(index));
			return (achievements.slice(1).filter((badge: any) => newBadgeIdx.includes(badge.index)));
		}
		return ([]);
	}, [userAchievement, prevBadges]);
	const { scores, setScores, dataGame, setDataGame, setEndGameInfo, userSimpleStat, userDoubleStat } = useContext(GameContext);
	const [ badgeId, setBadgeId ] = useState(0);
	const [ date, setDate ] = useState('');
	const navigate = useNavigate();
	const [ evoPoints, setEvoPoints ] = useState(0);
	const gameInfo = useMemo(() => {
		const go = dataGame.isDouble ? userDoubleStat.rankRate : userSimpleStat.rankRate;
		const win = dataGame.isDouble ? userDoubleStat.win : userSimpleStat.win;
		const lose = dataGame.isDouble ? userDoubleStat.lose : userSimpleStat.lose;
		return ({
			go: go,
			currWin: win,
			currLose: lose,
			difficulty: dataGame.speed === 1 ? "Easy" : dataGame.speed === 1.5 ? "Medium" : "Hard",
			badlvl: go >= 40 ? "Adept" : go >= 30 ? "Novice" : "Rookie",
			lvl: go < 10 ? "Rookie" : go < 20 ? "Novice" : go < 30 ? "Adept" : go < 40 ? "Master" : "Legend",
			goodlvl: go >= 40 ? "" : go >= 30 ? "Legend" : go >= 20 ? "Master" : go >= 10 ? "Adept" : "Novice",
			nextGoodlvl: go >= 20 ? "Legend" : go >= 10 ? "Master" : "Adept",
			pointsMinus: go >= 30 ? 3 : go >= 20 ? 2 : go >= 10 ? 1 : 0,
			pointsPlus: go >= 30 ? 1 : go >= 30 ? 2 : go >= 20 ? 3 : go >= 10 ? 3 : 4,
		});
	}, []);
	const grade = useMemo(() => {
		const newGo = gameInfo.go + evoPoints;
		const newlvl = newGo < 10 ? "Rookie" : newGo < 20 ? "Novice" : newGo < 30 ? "Adept" : newGo < 40 ? "Master" : "Legend";
		return (gameInfo.lvl !== newlvl && newlvl === gameInfo.badlvl ? '-' : newlvl === gameInfo.goodlvl ? '+' : '=');
	}, [evoPoints]);

	const handlePrev = () => {
		if (badgeId > 0)
			setBadgeId(badgeId - 1);
		handleSFX('clic');
	};
	const handleNext = () => {
		if ((badgeId + 1) < (newBadges.length ? newBadges.length : badgeToUnlock.length))
			setBadgeId(badgeId + 1);
		handleSFX('clic');
	};
	const handleGoHome = () => {
		navigate("/");
		setStatus("Online")
		setDataGame({mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
		setScores({x: 0, y: 0});
		setPrevBadges([]);
		handleSFX('exit');
	}
	const handleReplay = () => {
		setDataGame({...dataGame, id: undefined, opponent: undefined});
		setScores({x: 0, y: 0});
		setPrevBadges([]);
		if (dataGame.mode === "Online")
			setStatus("In Matchmaking");
		else
			setStatus("In Game")
		handleSFX('clic');
	}
	const handleChangeMode = () => {
		setStatus("Online")
		setDataGame({mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
		setScores({x: 0, y: 0});
		setPrevBadges([]);
		handleSFX('goBack');
	}
	useEffect(() => {
		const currentDate = new Date();
		const newDate = currentDate.toLocaleString('en-US', { month: 'short', day: '2-digit' });
		setDate(newDate);
		if (dataGame.mode === "Online" && !isAmical)
			setEndGameInfo({win: gameInfo.currWin, lose: gameInfo.currLose, points: scores.x === 11 ? gameInfo.pointsPlus : -gameInfo.pointsMinus, difficulty: gameInfo.difficulty, rankRate: gameInfo.go, date: newDate});
		else if (dataGame.mode === "Online")
		{
			if (scores.x === 11)
				socket.emit('resignGame', dataGame.id, name);
			socket.emit('gameFinished', name, scores);
			fetchGameInvite();
		}
	}, []);
	useEffect(() => {
		const timeInterval = setInterval(() => {
			if (scores.x === 11)
			{
				if (evoPoints < gameInfo.pointsPlus)
					setEvoPoints((prevPoints) => prevPoints + 1);
			}
			else
			{
				if (Math.abs(evoPoints) < gameInfo.pointsMinus && ((gameInfo.badlvl !== "Rookie") || (gameInfo.badlvl === "Rookie" && gameInfo.go)))
					setEvoPoints((prevPoints) => prevPoints - 1);
			}
		}, 750);
		return () => clearInterval(timeInterval);
	}, [evoPoints]);
	return (<Card style={{height: dataGame.mode === "Online" && !isAmical && userAchievement.length < 6 ? "75%" : "55%"}}>
				<Summary style={{height: dataGame.mode === "Online" && !isAmical && userAchievement.length < 6 ? "60%" : "80%", gridTemplateRows: dataGame.mode === "Online" && !isAmical ? "" : "50% 25%"}}>
					<Element style={{gridColumn: "1 / 4", gridRow: "1 / 2", flexDirection: "row", justifyContent: "space-evenly"}}>
						<Title style={{marginLeft: "-0.2vw"}}>{date}</Title>
						{dataGame.mode !== "Training" && dataGame.mode !== "Local" && <Title style={{fontSize: "2.4vw", marginLeft: "-0.9vw"}}>{scores.x}{'\t'}{scores.x === 11 ? "Victory" : "Defeat"}{'\t'}{scores.y}</Title>}
						{dataGame.mode === "Local" && <Title style={{fontSize: "2.4vw", marginLeft: "-1vw"}}>{scores.x}{'\t'}-{'\t'}{scores.y}</Title>}
						<Title style={{marginLeft: "-2.4vw"}}>{props.time}</Title>
					</Element>
					<Element style={{gridColumn: "1 / 2", gridRow: "2 / 3", marginLeft: "0.5vw"}}>
						<Title>Game Option</Title>
						<SubTitle>{dataGame.isDouble ? "Double" : "Simple"}</SubTitle>
					</Element>
					<Element style={{gridColumn: "2 / 3", gridRow: "2 / 3", marginLeft: "0.5vw"}}>
						<Title style={{fontSize: "2.5vw"}}>Mode</Title>
						<Title>{dataGame.mode === "Online" && isAmical ? "Amical" : dataGame.mode}</Title>
					</Element>
					<Element style={{gridColumn: "3 / 4", gridRow: "2 / 3", marginLeft: "-0.5vw"}}>
						<Title>Difficulty</Title>
						<SubTitle>{gameInfo.difficulty}</SubTitle>
					</Element>
					<Element style={{display: dataGame.mode === "Online" && !isAmical ? "flex" : "none", flexDirection: "row", justifyContent: "space-around", gridColumn: "1 / 4", gridRow: "3 / 4"}}>
						<Title style={{marginLeft: "2.5vw"}}>{grade === '-' ? gameInfo.badlvl : grade === '+' ? gameInfo.goodlvl : gameInfo.lvl}</Title>
						<SubTitle>{gameInfo.go + evoPoints}RR</SubTitle>
						<SubTitle>{scores.x === 11 ? `+${evoPoints}` : !evoPoints ? '-0' : evoPoints}</SubTitle>
						<Title style={{marginRight: "2.7vw"}}>{grade === '-' ? gameInfo.lvl : grade === '+' ? gameInfo.nextGoodlvl : gameInfo.goodlvl}</Title>
					</Element>
					<Element style={{display: dataGame.mode === "Online" && !isAmical ? "flex" : "none", gridColumn: "1 / 4", gridRow: "4 / 5"}}>
						<ProgressBar max={10} value={(gameInfo.go + evoPoints) % 10}/>
					</Element>
				</Summary>
				<Achievement style={{display: dataGame.mode === "Online" && !isAmical && userAchievement.length < 6 ? "flex" : "none"}}>
					<StyledButton onClick={handlePrev} style={{visibility: badgeId > 0 ? "visible" : "hidden", width: "6.5%", height: "50%", fontSize: "1.2vw", marginTop: "0.8vh"}}>{'<'}</StyledButton>
					<img style={{height: "8vh", marginRight: "-2vw", marginTop: "0.8vh"}} src={newBadges.length ? newBadges[badgeId]?.picture : achievements[0].picture} alt='Achievement.png'/>
					<div style={{height: "100%", width: "46%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
						<Title style={{fontSize: "1.4vw"}}>{newBadges.length ? "New Achievement Unlocked!" : "Unlockable Achievement"}</Title>
						<SubTitle style={{fontSize: "1.2vw"}}>{newBadges.length ? newBadges[badgeId]?.title : badgeToUnlock[badgeId]?.title}</SubTitle>
						<Text style={{fontSize: "0.9vw"}}>{newBadges.length ? newBadges[badgeId]?.description : badgeToUnlock[badgeId]?.description}</Text>
					</div>
					<StyledButton onClick={handleNext} style={{visibility: (badgeId + 1) < (newBadges.length ? newBadges.length : badgeToUnlock.length) ? "visible" : "hidden", width: "6.5%", height: "50%", fontSize: "1.2vw", marginTop: "0.8vh"}}>{'>'}</StyledButton>
				</Achievement>
				<EndButton style={{height: dataGame.mode === "Online" && !isAmical && userAchievement.length < 6 ? "15%" : "25%"}}>
					<StyledButton onClick={handleGoHome}>Go home</StyledButton>
					<StyledButton onClick={handleReplay}>Play {dataGame.mode === "Online" && isAmical ? "Online" : "Again"}</StyledButton>
					<StyledButton onClick={handleChangeMode}>Change Mode</StyledButton>
				</EndButton>
			</Card>);
}

export default EndGame;
