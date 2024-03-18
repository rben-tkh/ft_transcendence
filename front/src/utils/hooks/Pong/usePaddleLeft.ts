import { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { WebSocketContext } from '../../context/WebSocketContext/index.tsx';
import { ProfileContext } from '../../context/ProfileContext/index.tsx';
import { GameContext } from '../../context/GameContext/index.tsx';

function usePaddleLeft()
{
	const { socket } = useContext(WebSocketContext);
	const { name } = useContext(ProfileContext);
	const { dataGame, speed, gamePaused } = useContext(GameContext);
	const [ paddleLeft, setPaddleLeft ] = useState<number>(42);
	const speedOpti = useMemo(() => !speed ? (0.25 * dataGame.speed!) : (speed / 2), [speed]);
	const keysPressed = useRef<{ [key: string]: boolean }>({});

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => keysPressed.current[event.key] = true;
		const handleKeyUp = (event: KeyboardEvent) => keysPressed.current[event.key] = false;
		const movePaddle = () => {
			if (!gamePaused)
			{
				if (keysPressed.current['ArrowUp'] && paddleLeft >= 0.4)
					setPaddleLeft(paddleLeft - speedOpti);
				else if (keysPressed.current['ArrowDown'] && paddleLeft <= 84.4)
					setPaddleLeft(paddleLeft + speedOpti);
				if (dataGame.mode === "Online")
					socket.emit('movePaddle', paddleLeft, name, dataGame.id);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		const interval = setInterval(movePaddle, 2);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			clearInterval(interval);
		};
	}, [paddleLeft, gamePaused]);
	return (paddleLeft);
}

export default usePaddleLeft;
