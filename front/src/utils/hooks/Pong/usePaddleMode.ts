import { useState, useMemo, useEffect, useContext } from 'react';
import { GameContext } from '../../context/GameContext/index.tsx';

function usePaddleMode() {
	const { dataGame, scores } = useContext(GameContext);
	const [ first, setFirst ] = useState({y: 0, height: 25});
	const [ tar, setTar ] = useState({y: 0, height: 0});
	const [ second, setSecond ] = useState({y: 74.5, height: 25});
	const heightLvl = useMemo(() => (30 - (5 * dataGame.speed)), []);
	const max = useMemo(() => (99.5 - heightLvl), []);
	const [direction, setDirection] = useState(0);
	const newValue = useMemo(() => first.height + (0.5 * direction), [first]);

	useEffect(() => {
		if (dataGame.mode === "Training") {
			setDirection(0);
			const timeoutId = setTimeout(() => {
				const random = Math.floor(Math.random() * max);
				setDirection(1);
				setFirst({y: 0, height: random});
				setTar({y: random, height: heightLvl});
				setSecond({y: random + heightLvl, height: max - random});
			}, (scores.x === 0 ? 0 : 1250));
			return () => clearTimeout(timeoutId);
		}
	}, [scores]);
	useEffect(() => {
		if (dataGame.mode === "Training" && dataGame.speed === 2) {
			const intervalId = setInterval(() => {
				setFirst(({ y: 0, height: newValue }));
				setTar(({ y: newValue, height: heightLvl }));
				setSecond(({ y: newValue + heightLvl, height: max - newValue }));
				if (newValue >= max || newValue <= 0)
					setDirection(direction * -1);
			}, dataGame.isDouble ? 50 : 100)
			return() => clearInterval(intervalId);
		}
	}, [first]);
	return {top: first, target: tar, bot: second};
}

export default usePaddleMode;
