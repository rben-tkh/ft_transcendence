import styled from 'styled-components';
import { useMemo, useContext, useRef } from 'react';
import { GameContext } from '../../../utils/context/GameContext/'
import { SoundContext } from '../../../utils/context/SoundContext/'
import { Link } from 'react-router-dom';
import usePaddleLeft from '../../../utils/hooks/Pong/usePaddleLeft.ts'
import usePaddleRight from '../../../utils/hooks/Pong/usePaddleRight.ts'
import useBall from '../../../utils/hooks/Pong/useBall.ts'
import usePaddleMode from '../../../utils/hooks/Pong/usePaddleMode.ts';
import Crack from '../../../assets/images/game/crack.png';

const Container = styled.div`
	height: 100%;
	width: 100%;
`

const Score = styled.h2`
	font-size: 4vh;
	font-weight: 500;
	position: absolute;
	left: 35%;
	transform: translate(-50%, -80%);
`

const Time = styled.h3`
	font-size: 3.3vh;
	padding: 0vh 0.5vw;
	position: absolute;
	font-weight: 500;
	left: 50%;
	border-left: 2px solid dimgrey;
	border-right: 2px solid dimgrey;
	border-radius: 5px;
	transform: translate(-50%, -90%);
`

const Divider = styled.div`
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	white-space: pre;
	font-size: 3.7vh;
`;

const Ground = styled.div`
	position: relative;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: 100%;
	height: 90%;
	border: 2px solid dimgrey;
`;

const Paddle = styled.div.attrs<{ $targetState?: string, $top: number, $height: number, $left: number }>(
	(props) => ({
		style: {
			backgroundImage: props.$targetState === "cracked" ? `url(${Crack})` : undefined,
			backgroundSize: props.$targetState === "cracked" ? "100%" : undefined,
			opacity: props.$targetState === "cracked" ? 0.98 : 1,
			top: `${props.$top}%`
		}
	}))<{ $height: number, $left: number }>`
	width: 1.5%;
	height: ${(props) => `${props.$height}%`};
	position: absolute;
	left: ${(props) => `${props.$left}%`};
	border: 2px solid white;
	border-radius: 3px;
	background: white;
`;

const Ball = styled.div.attrs<{ $top: number, $left: number }>
	((props) => ({
		style: {
			top: `${props.$top}%`,
			left: `${props.$left}%`
	}}))`
	width: 1%;
	height: 2%;
	position: absolute;
	border: 2px solid white;
	border-radius: 50%;
	background: white;
`;

const Notice = styled.p`
	position: absolute;
	font-size: 3vh;
	top: 91%;
	left: 15%;
	width: 100%;
`;

const Leave = styled(Link)`
	font-size: 2vh;
	position: absolute;
	bottom: -1%;
	left: 75%;
	transform: translate(-50%, -38%);
	padding: 1px 5px;
	border: 1px solid dimgrey;
	border-radius: 5px;
	background: rgb(50, 50, 50);
	&:hover{background: rgb(75, 75, 75);}
	&:active{background: dimgrey;}
	transition: background-color 200ms ease-in-out;
`

function Pong(props: {time: string})
{
	const { scores, dataGame, targetState, setGamePaused, ball } = useContext(GameContext);
	const { handleSFX } = useContext(SoundContext);
	const rightRef = useRef(null);
	const leftRef = useRef(null);
	const ballRef = useRef(null);
	const paddleLeft = usePaddleLeft();
	const paddleRight = usePaddleRight(leftRef, rightRef, ballRef);
	const paddleMode = usePaddleMode();
	const divider = useMemo(() => ("|\n".repeat(15)), []);
	const leftNameScore = useMemo(() => {
		if (dataGame.mode === "Local")
			return ("Player 1");
		else
			return ("You");
	}, []);
	const rightNameScore = useMemo(() => {
		if (dataGame.mode === "Local")
			return ("Player 2");
		else if (dataGame.mode === "Bot")
			return ("Bot");
		else if (dataGame.mode === "Online")
			return (`#${dataGame.opponent}`);
	}, []);

	const handleLeave = () => {
		setGamePaused("leave");
		handleSFX("goBack");
	}
	useBall({width: 2, height: 15, radius: 1}, {height: 25, bot: 74.5, leftX: 5.1, rightX: 94.9}, {x: 7, y: paddleLeft}, {x: 93, y: paddleRight}, {left: 75, right: 25}, paddleMode.target)
	return (<Container>
				<Score style={{left: "15%", fontSize: "3.5vh"}}>{leftNameScore}</Score>
				<Score>{scores.x}</Score>
				<Time>{props.time}</Time>
				{dataGame.mode === "Training" ? <Score style={{left: "75%", fontSize: "3.5vh"}}>Training Mode</Score> :
				<><Score style={{left: "65%"}}>{scores.y}</Score><Score style={{left: "85%", fontSize: "3.5vh"}}>{rightNameScore}</Score></>}
				<Divider>{divider}</Divider>
				<Ground>
					{dataGame.isDouble && <Paddle $height={25} $top={0} $left={5}></Paddle>}
					<Paddle ref={leftRef} $height={15} $top={paddleLeft} $left={7}></Paddle>
					{dataGame.isDouble && <Paddle $height={15} $top={paddleLeft} $left={74}></Paddle>}
					{dataGame.isDouble && <Paddle $height={25} $top={74.5} $left={5}></Paddle>}
					<Ball ref={ballRef} $top={ball.y} $left={ball.x}></Ball>
					{(dataGame.isDouble || dataGame.mode === "Training") && <Paddle $height={paddleMode.top.height} $top={paddleMode.top.y} $left={95}></Paddle>}
					{dataGame.mode !== "Training" && <Paddle ref={rightRef} $height={15} $top={paddleRight} $left={93}></Paddle>}
					{dataGame.isDouble && dataGame.mode !== "Training" && <Paddle $height={15} $top={paddleRight} $left={26}></Paddle>}
					{dataGame.isDouble && dataGame.mode === "Training" && targetState !== "broken" && <Paddle $targetState={targetState} $height={paddleMode.target.height} $top={paddleMode.target.y} $left={93}></Paddle>}
					{(dataGame.isDouble || dataGame.mode === "Training") && <Paddle $height={paddleMode.bot.height} $top={paddleMode.bot.y} $left={95}></Paddle>}
				</Ground>
				<Notice>Press ↑ and ↓ to move</Notice>
				{dataGame.mode === "Local" && <Leave style={{left: "50%"}} to="/game" onClick={handleLeave}>Leave Game</Leave>}
				{dataGame.mode === "Local" ? <Notice style={{left: "65%"}}>Use mouse to move</Notice> :
				<Leave to="/game" onClick={handleLeave}>Leave Game</Leave>}
			</Container>);
}

export default Pong;
