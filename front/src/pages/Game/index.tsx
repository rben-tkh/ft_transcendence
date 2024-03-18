import { useEffect, useContext, useState } from 'react';
import Pong from '../../components/Game/Pong/';
import { StyledContainer } from '../../utils/styles/Atoms.tsx'
import { GameContext } from '../../utils/context/GameContext/';
import ModeMenu from '../../components/Game/ModeMenu/';
import EndGame from '../../components/Game/EndGame/';
import Matchmaking from '../../components/Game/Matchmaking/index.tsx';
import { ProfileContext } from '../../utils/context/ProfileContext/index.tsx';

function formatTime(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
	const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

	return (`${formattedMinutes}:${formattedSeconds}`);
}

function Game()
{
	const { elapsedSeconds, setElapsedSeconds, setDirection, gamePaused } = useContext(GameContext);
	const { status } = useContext(ProfileContext);
	const [ time, setTime ] = useState(0);

	useEffect(() => {
		document.title = 'Game - ft_transcendence';
		const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();
		const contextMenuListener: EventListener = (e) => handleContextMenu(e as unknown as React.MouseEvent);
		document.addEventListener('contextmenu', contextMenuListener);
		return () => document.removeEventListener('contextmenu', contextMenuListener);
	}, []);
	useEffect(() => {
		setTime(formatTime(elapsedSeconds));
		setDirection('left');
		const timeInterval = setInterval(() => {
			if (!gamePaused)
				setElapsedSeconds((prevSeconds) => prevSeconds + 1);
		}, 1000);
		return () => {
			if (status !== "In Game")
				setElapsedSeconds(0);
			clearInterval(timeInterval)
		};
	}, [status, gamePaused]);
	return (
			<StyledContainer>
				{status === "Online" && <ModeMenu />}
				{status === "In Matchmaking" && <Matchmaking time={formatTime(elapsedSeconds)} />}
				{status === "In Game" && <Pong time={formatTime(elapsedSeconds)} />}
				{status === "In Postmatch" && <EndGame time={time}/>}
			</StyledContainer>);
}

export default Game;
