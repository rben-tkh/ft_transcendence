import { useState, useEffect, useMemo, useContext } from 'react';
import { GameContext } from '../../context/GameContext/index.tsx';
import useWindowSize from '../WindowSize/useWindowSize.ts';

function getRandom(nbApprox: number, lvl: number)
{
	const min = -(nbApprox - lvl);
	const max = (nbApprox - lvl);

	return (Math.floor(Math.random() * (max - min) + min));
}	

function usePaddleRight(leftRef: React.RefObject<HTMLDivElement>, rightRef: React.RefObject<HTMLDivElement>, ballRef: React.RefObject<HTMLDivElement>)
{
	const inner = useWindowSize();
	const { dataGame, direction, speed, scores, paddleRightY, ball, gamePaused } = useContext(GameContext);
	const [ paddleRight, setPaddleRight ] = useState(42);
	const [ mousePos, setMousePos ] = useState({x: 0, y: 0});
	const midGround = useMemo(() => (inner.x * 0.5), [inner]);
	const quarterGround = useMemo(() => (inner.x * 0.25), [inner]);
	const midY = useMemo(() => (inner.y * 0.5), [inner]);
	const beginY = useMemo(() => (inner.y * 0.49), [inner]);
	const endY = useMemo(() => (inner.y * 0.51), [inner]);
	const approx = useMemo(() => getRandom((inner.y * 0.033), (dataGame.speed / 10)), [inner, direction, scores]);
	const speedOpti = useMemo(() => !speed ? (0.25 * dataGame.speed!) : (speed / 2), [speed]);

	useEffect(() => {
		if (dataGame.mode === "Online")
			setPaddleRight(paddleRightY);
		else if (dataGame.mode === "Bot")
		{
			const moveBot = () => {
				if (rightRef.current && ballRef.current && leftRef.current)
				{
					const rightInfo = rightRef.current.getBoundingClientRect();
					const ballInfo = ballRef.current.getBoundingClientRect();
					const leftInfo = leftRef.current.getBoundingClientRect();
					const rightPos = rightInfo.y + rightInfo.height * (leftInfo.y > midY ? 0.15 : 0.65);
					const ballY = ballInfo.y + approx;
					if (dataGame.isDouble && direction === "left" && ballInfo.x < midGround && ballInfo.x > quarterGround && ballInfo.y > rightInfo.y && ballInfo.y < (rightInfo.y + rightInfo.height))
					{
						if (ballInfo.y > midY && paddleRight >= 0.4)
							setPaddleRight(paddleRight - speedOpti);
						else if (ballInfo.y < midY && paddleRight <= 84.4)
							setPaddleRight(paddleRight + speedOpti);
					}
					else if ((ballInfo.x > midGround && direction === "right") || (dataGame.isDouble && ballInfo.x < quarterGround))
					{
						if (rightPos > ballY && paddleRight >= 0.4)
							setPaddleRight(paddleRight - speedOpti);
						else if (rightPos < ballY && paddleRight <= 84.4)
							setPaddleRight(paddleRight + speedOpti);
					}
					else if (ballInfo.x < midGround && direction === "left" && !dataGame.isDouble && dataGame.speed === 2)
					{
						if (rightInfo.y > endY)
							setPaddleRight(paddleRight - speedOpti);
						else if (rightInfo.y < beginY)
							setPaddleRight(paddleRight + speedOpti);
					}
				}
			}
			const interval = setInterval(moveBot, 2);
			return () => clearInterval(interval);
		}
		else if (dataGame.mode === "Local")
		{
			const handleMouseMove = (event: MouseEvent) => setMousePos({x: event.clientX, y: event.clientY});
			const movePaddle = () => {
				if (!gamePaused && rightRef.current)
				{
					const rightInfo = rightRef.current.getBoundingClientRect();
					if (mousePos.x >= midGround && mousePos.y < rightInfo.y && paddleRight >= 0.4)
						setPaddleRight(paddleRight - speedOpti);
					else if (mousePos.x >= midGround && rightRef.current && mousePos.y > (rightInfo.y + rightInfo.height) && paddleRight < 84.4)
						setPaddleRight(paddleRight + speedOpti);
				}
			};
			window.addEventListener('mousemove', handleMouseMove);
			const interval = setInterval(movePaddle, 2);
			return () => {
				window.removeEventListener('mousemove', handleMouseMove);
				clearInterval(interval);
			};
		}
	}, [paddleRight, paddleRightY, mousePos, ball.y, gamePaused]);
	return (paddleRight);
}

export default usePaddleRight;
