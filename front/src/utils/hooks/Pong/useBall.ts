import { useState, useEffect, useMemo, useContext } from 'react';
import { ProfileContext } from '../../context/ProfileContext'
import { SoundContext } from '../../context/SoundContext'
import { GameContext } from '../../context/GameContext'

function useBall(gameData: { width: number, height: number, radius: number}, wallData: { height: number, bot: number, leftX: number, rightX: number}, paddleLeft: {x: number, y: number}, paddleRight: {x: number, y: number}, secondPaddleData: {left: number, right: number}, target: {y: number, height: number})
{
	const { setStatus } = useContext(ProfileContext);
	const { handleSFX } = useContext(SoundContext);
	const { scores, setScores, dataGame, direction, setDirection, speed, setSpeed, targetState, setTargetState, pauseAsked, ball, setBall, gamePaused, setGamePaused } = useContext(GameContext);
	const [stopGame, setStopGame] = useState<boolean>(true);
	const initialBallPos = useMemo(() => ({ x: direction === 'left' ? 53.2 : 47.2, y: Math.random() * 97}), [stopGame]);
	const newBall = useMemo(() => ({ ...ball }), [ball]);
	const [ballX, setballX] = useState<number>(0);
	const [ballY, setballY] = useState<number>((Math.random() * 1.5) - 0.5);
	const wallX = useMemo(() => ({left: wallData.leftX + (gameData.width * 0.9), right: wallData.rightX - (gameData.radius * 1.4)}), [wallData.leftX, wallData.rightX]);
	const secondPaddleX = useMemo(() => ({left: secondPaddleData.left - gameData.width, right: secondPaddleData.right - (gameData.radius * 0.4)}), [secondPaddleData.left, secondPaddleData.right]);
	const secondPaddleMiddleX = useMemo(() => ({left: secondPaddleX.left + (gameData.width / 2), right: secondPaddleX.right + (gameData.width / 2)}), [secondPaddleX]);
	const secondPaddleSideX = useMemo(() => ({left: secondPaddleData.left + (gameData.radius * 0.9), right: secondPaddleData.right + (gameData.width * 1.3)}), [secondPaddleData.left, secondPaddleData.right]);
	const paddleX = useMemo(() => ({left: paddleLeft.x + gameData.width, right: paddleRight.x - gameData.radius}), [paddleLeft.x, paddleRight.x]);
	const paddleHeight = useMemo(() => ({left: paddleLeft.y + gameData.height, right: paddleRight.y + gameData.height }), [paddleLeft.y, paddleRight.y]);
	const targetHeight = useMemo(() => (target.y + target.height), [target]);
	const paddleCenter = useMemo(() => ({left: (paddleLeft.y + gameData.height / 2) , right: (paddleRight.y + gameData.height / 2)}), [paddleLeft.y, paddleRight.y]);
	const targetCenter = useMemo(() => (target.y + target.height / 2), [target]);
	const deltaLeftY = useMemo(() => (newBall.y - paddleCenter.left) / (gameData.height * 0.8), [newBall, paddleCenter.left]);
	const deltaRightY = useMemo(() => (newBall.y - paddleCenter.right) / (gameData.height * 0.8), [newBall, paddleCenter.right]);
	const deltaTrainingY = useMemo(() => (newBall.y - targetCenter) / target.height, [newBall, target]);

	useEffect(() => {
		if (dataGame.mode !== "Online")
		{
			setBall(initialBallPos);
			setSpeed(0.25 * dataGame.speed!);
		}
	}, [])
	useEffect(() =>
	{
		if (dataGame.mode === "Online")
			return ;
		const interval = setInterval(() =>
			{
				if (stopGame)
				{
					if (scores.x !== 11 && scores.y !== 11)
					{
						if (pauseAsked)
							setGamePaused("header");
						else if (!gamePaused)
						{
							setTimeout(() => {
								if (dataGame.mode === "Training")
								{
									setDirection('left');
									setTargetState("visible");
								}
								setStopGame(false);
							}, 1250);
						}
					}
					else
						setStatus("In Postmatch")
					clearInterval(interval);
				}
				else if (!gamePaused || gamePaused === "leave")
				{
					direction === 'right' ? setballX(ballX + speed) : setballX(ballX - speed)
					newBall.x = ball.x + (direction === 'right' ? speed : -speed);
					newBall.y = ball.y + ballY;
					setBall(newBall);
					if (dataGame.isDouble && ((newBall.y >= (paddleLeft.y - gameData.width) && newBall.y <= paddleHeight.left && ((newBall.x >= secondPaddleX.left && newBall.x <= secondPaddleMiddleX.left) || (newBall.x <= secondPaddleSideX.left && newBall.x >= secondPaddleMiddleX.left)))
					|| (dataGame.mode !== "Training" && newBall.y >= (paddleRight.y - gameData.width) && newBall.y <= paddleHeight.right && ((newBall.x >= secondPaddleX.right && newBall.x <= secondPaddleMiddleX.right) || (newBall.x <= secondPaddleSideX.right && newBall.x >= secondPaddleMiddleX.right)))
					|| (dataGame.mode === "Training" && targetState !== "broken" && newBall.x >= paddleX.right && newBall.y >= target.y && newBall.y <= targetHeight)))
					{
						if (dataGame.mode === "Training" && newBall.x >= paddleX.right && newBall.y >= target.y && newBall.y <= targetHeight)
						{
							setTargetState((targetState === "visible" && dataGame.speed > 1) ? "cracked" : "broken");
							handleSFX((targetState === "visible" && dataGame.speed > 1) ? "cracked" : "broken");
						}
						else
							handleSFX("paddle");
						if ((newBall.x <= secondPaddleSideX.left && newBall.x >= secondPaddleMiddleX.left) || (newBall.x <= secondPaddleSideX.right && newBall.x >= secondPaddleMiddleX.right))
							setDirection('right');
						else
							setDirection('left');
						if (dataGame.mode === "Training" && newBall.x >= paddleX.right && newBall.y >= target.y && newBall.y <= targetHeight)
							setballY(deltaTrainingY);
						else if (newBall.x >= secondPaddleX.left && newBall.x <= secondPaddleSideX.left)
							setballY(deltaLeftY);
						else if (newBall.x >= secondPaddleX.right && newBall.x <= secondPaddleSideX.right)
							setballY(deltaRightY);
					}
					else if ((newBall.x <= paddleX.left && newBall.y >= (paddleLeft.y - gameData.width) && newBall.y <= paddleHeight.left)
					|| (dataGame.mode !== "Training" && newBall.x >= paddleX.right && newBall.y >= (paddleRight.y - gameData.width) && newBall.y <= paddleHeight.right)
					|| (dataGame.isDouble && ((newBall.x <= wallX.left && (newBall.y <= wallData.height || newBall.y >= wallData.bot))
					|| (dataGame.mode !== "Training" && newBall.x >= wallX.right && (newBall.y <= wallData.height || newBall.y >= wallData.bot))
					|| (dataGame.mode === "Training" && !(newBall.x >= paddleX.right && newBall.y >= target.y && newBall.y <= targetHeight) && newBall.x >= wallX.right))))
					{
						setDirection(newBall.x <= paddleX.left ? 'right' : 'left');
						if (speed < 1)
							setSpeed(speed + 0.01);
						if (!(newBall.x <= wallX.left || newBall.x >= wallX.right))
							setballY(newBall.x <= paddleX.left ? deltaLeftY : deltaRightY);
						handleSFX("paddle");
					}
					else if (newBall.y <= 0 || newBall.y >= 97.4)
					{
						setballY(newBall.y <= 0 ? Math.abs(ballY) : -Math.abs(ballY));
						handleSFX("wall");
					}
					else if (newBall.x <= wallX.left || newBall.x >= wallX.right)
					{
						if (newBall.x <= wallX.left && dataGame.mode !== "Training")
							setScores({ x: scores.x, y: scores.y + 1 });
						else if (newBall.x >= wallX.right)
							setScores({ x: scores.x + 1, y: scores.y });
						if (scores.x !== 11 && scores.y !== 11)
							handleSFX("goal");
						setSpeed(0.25 * dataGame.speed!);
						setballY((Math.random() * 1.5) - 0.5);
						setBall(initialBallPos);
						setStopGame(true);
					}
				}
			}, 10);
			return () => clearInterval(interval);
	}, [ball, stopGame, gamePaused, pauseAsked]);
}

export default useBall;
