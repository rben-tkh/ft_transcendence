import { NodeJS } from 'node';
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { ProfileContext } from '../ProfileContext';
import { WebSocketContext } from '../WebSocketContext';

type GameContextType = {
	showMode: boolean,
	setShowMode: (value: boolean) => void;
	scores: {x: number, y: number};
	setScores: (value: {x: number, y: number}) => void;
	dataGame: {mode?: string, isDouble?: boolean, speed?: number, id?: number, opponent?: string};
	setDataGame: (value: {mode?: string, isDouble?: boolean, speed?: number, id?: number, opponent?: string}) => void;
	direction: 'left' | 'right';
	setDirection: (value: 'left' | 'right') => void;
	speed: number;
	setSpeed: (value: number) => void;
	elapsedSeconds: number;
	setElapsedSeconds: (value: number) => void;
	targetState: string;
	setTargetState: (value: string) => void;
	dataOpponent: { pfp: string, rank: string, rankRate: number, badgeIdx: number};
	setDataOpponent: (value: { pfp: string, rank: string, rankRate: number, badgeIdx: number }) => void;
	endGameInfo?: {win: number, lose: number, points: number, difficulty: string, rankRate: number , date: string};
	setEndGameInfo: (value?: {win: number, lose: number, points: number, difficulty: string, rankRate: number , date: string}) => void;
	pauseAsked: boolean;
	setPauseAsked: (value: boolean) => void;
	prevBadges: number[];
	setPrevBadges: (value: any) => void;
	paddleRightY: number;
	gamePaused: string | null;
	setGamePaused: (value: string | null) => void;
	ball: {x: number, y: number};
	setBall: (value: {x: number, y: number}) => void;
	userSimpleStat: { rank: string; win: number; lose: number; rankRate: number };
	setUserSimpleStat: (value: { rank: string; win: number; lose: number; rankRate: number }) => void;
	userDoubleStat: { rank: string; win: number; lose: number; rankRate: number };
	setUserDoubleStat: (value: { rank: string; win: number; lose: number; rankRate: number }) => void;
	isAmical: boolean;
	setIsAmical: (value: boolean) => void;
};

export const GameContext = createContext<GameContextType>({
	showMode: true,
	setShowMode: () => {},
	scores: {x: 0, y: 0},
	setScores: () => {},
	dataGame: {mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined},
	setDataGame: () => {},
	direction: 'left',
	setDirection: () => {},
	speed: 0,
	setSpeed: () => {},
	elapsedSeconds: 0,
	setElapsedSeconds: () => {},
	targetState: "visible",
	setTargetState: () => {},
	dataOpponent: { pfp: '', rank: '', rankRate: 0, badgeIdx: 0 },
	setDataOpponent: () => {},
	endGameInfo: undefined,
	setEndGameInfo: () => {},
	pauseAsked: false,
	setPauseAsked: () => {},
	prevBadges: [],
	setPrevBadges: () => {},
	paddleRightY: -50,
	gamePaused: null,
	setGamePaused: () => {},
	ball: {x: -50, y: -50},
	setBall: () => {},
	userSimpleStat: { rank: 'Rookie', win: 0, lose: 0, rankRate: 0 },
	setUserSimpleStat: () => {},
	userDoubleStat: { rank: 'Rookie', win: 0, lose: 0, rankRate: 0 },
	setUserDoubleStat: () => {},
	isAmical: false,
	setIsAmical: () => {},
});

export const GameProvider = ({ children }: { children: ReactNode }) => {
	const { token, headers, socket } = useContext(WebSocketContext);
	const { userAchievement, setUserAchievement } = useContext(ProfileContext)
	const [ showMode, setShowMode ] = useState(true);
	const initialDataGame = localStorage.getItem('dataGame');
	const [ dataGame, setDataGameState ] = useState<{mode?: string, isDouble?: boolean, speed?: number, id?: number, opponent?: string}>(initialDataGame && JSON.parse(initialDataGame).mode === "Online" ? JSON.parse(initialDataGame) : {mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
	const setDataGame = (value: {mode?: string, isDouble?: boolean, speed?: number, id?: number, opponent?: string}) => {
		localStorage.setItem('dataGame', JSON.stringify(value));
		setDataGameState(value);
	};
	const initialDataOpponent = localStorage.getItem('dataOpponent');
	const [ dataOpponent, setDataOpponentState ] = useState<{ pfp: string, rank: string, rankRate: number, badgeIdx: number }>(initialDataOpponent && dataGame.mode === "Online" ? JSON.parse(initialDataOpponent) : { pfp: '', rank: '', rankRate: 0, badgeIdx: 0 });
	const setDataOpponent = (value: { pfp: string, rank: string, rankRate: number, badgeIdx: number }) => {
		localStorage.setItem('dataOpponent', JSON.stringify(value));
		setDataOpponentState(value);
	};
	const [ scores, setScores]  = useState<{x: number, y: number}>({x: 0, y: 0});
	const [ direction, setDirection ] = useState<'left' | 'right'>('left');
	const [ speed, setSpeed ] = useState(0);
	const [ elapsedSeconds, setElapsedSeconds ] = useState(0);
	const [ targetState, setTargetState ] = useState("visible");
	const [ endGameInfo, setEndGameInfo ] = useState<{win: number, lose: number, points: number, difficulty: string, rankRate: number , date: string} | undefined>(undefined);
	const [ pauseAsked, setPauseAsked ] = useState(false);
	const [ prevBadges, setPrevBadges ] = useState([]);
	const { name, status, setStatus, friendsData, logged } = useContext(ProfileContext);
	const [ paddleRightY, setPaddleRightY ] = useState<number>(-50);
	const [ gamePaused, setGamePaused ] = useState<string | null>(null);
	const [ ball, setBall ] = useState<{x: number, y: number}>({x: -50, y: -50});
	const [ userSimpleStat, setUserSimpleStat ] = useState({ rank: 'Rookie', win: 0, lose: 0, rankRate: 0 });
	const [ userDoubleStat, setUserDoubleStat ] = useState({ rank: 'Rookie', win: 0, lose: 0, rankRate: 0 });
	const [ isAmical, setIsAmical ] = useState(false);

	const fetchEndGame = async () => {
		try {
			const matchHistoryData = {
					difficulty: endGameInfo.difficulty,
					rankRate: endGameInfo.rankRate,
					scorex: scores.x,
					scorey: scores.y,
					isDouble: dataGame.isDouble,
					date: endGameInfo.date,
					opponentName: dataGame.opponent,
					opponentRR: dataOpponent.rankRate,
			};
			const matchResultData = {
				isDouble: dataGame.isDouble,
				currRankRate: endGameInfo.rankRate,
				currWin: endGameInfo.win,
				currLose: endGameInfo.lose,
				points: endGameInfo.points,
				hasWon: scores.x === 11 ? true : false,
				scorex: scores.x,
				scorey: scores.y
			};
			await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/game/match-history', matchHistoryData, { headers });
			axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/game/set-newGame', matchResultData, { headers })
			.then((res) => {
				setPrevBadges([...userAchievement]);
				setUserAchievement([...res.data]);
			}).catch ((error) => {
				console.log("Error when set-newGame : ", error);
			});
			setEndGameInfo(undefined);
		} catch (error) {
			console.error('An error occurred while sending the match result:', error);
		}
	};
	useEffect(() => {
		if (endGameInfo !== undefined)
			fetchEndGame();
	}, [endGameInfo]);

	const getUserStats = async () => {
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/getUserData', { params: { name: name}, headers })
		.then((response) => {
			if (response.data)
			{
				setUserSimpleStat(response.data.simple);
				setUserDoubleStat(response.data.double);
			}
		}).catch ((error) => {
		console.error('Error fetching user stats:', error);
		});
	};
	const getOpponentData = async (opponent: string, lobby: number) => {
		axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/game/get-opponent', {params: {username: opponent, mode: dataGame.isDouble ? "Double" : "Simple" }, headers})
		.then((response) => {
			if (response.data)
			{
				setDataOpponent({ pfp: response.data.pfp, rank: response.data.rank, rankRate: response.data.rankRate, badgeIdx: response.data.badgeIdx });
				setDataGame({...dataGame, id: lobby, opponent: opponent});
			}
		}).catch((error) => { 
			console.error('Error fetching opponent data:', error);
		});
	};
	const fetchStatus = async () => {
		await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/updateStatus`, { status: status }, { headers })
	};
	useEffect(() => {
		socket.emit('gameReconnexion', name, dataGame.id);
		socket.once('reconnected', (lastScore: {x: number, y: number}) => {
			setScores(lastScore);
			setGamePaused("header");
			setStatus("In Game");
		});
		socket.once('notReconnected', () => {
			setDataGame({mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
			setDataOpponent({ pfp: '', rank: '', rankRate: 0, badgeIdx: 0 });
		});
	}, []);
	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (status === "In Matchmaking" && dataGame.id !== undefined)
		{
			timeoutId = setTimeout(() => {
				setStatus("In Game");
			}, 5000);
		}
		return () => clearTimeout(timeoutId);
	}, [status, dataGame.id]);
	useEffect(() => {
		if (token && logged)
		{
			fetchStatus();
			if ((status !== "In Game" && status !== "In Postmatch") || dataGame.mode === "Online")
				socket.emit('newFriendInfo', friendsData.map((friend) => friend.name));
		}
		if (status === "In Matchmaking" || status === "In Game")
		{
			socket.on('pauseState', (pauseAsked: boolean, pausedState?: string) => {
				if (pauseAsked)
					setGamePaused(pausedState);
				else
					setGamePaused(null);
			});
			socket.on('gameResigned', (resigner: string, newScores: {x: number, y: number}) => {
				if (resigner !== name)
				{
					setScores(newScores);
					setStatus("In Postmatch");
				}
			});
		}
		if (status === "In Matchmaking")
		{
			getUserStats();
			if (!isAmical)
				socket.emit('gameMode', `${dataGame.isDouble}${dataGame.speed}${dataGame.isDouble ? userDoubleStat.rank : userSimpleStat.rank}`, dataGame.speed, dataGame.isDouble, name);
			socket.on('Match starts soon', (lobby: number) => {
				socket.emit('acceptMatch', name, lobby);
			});
			socket.on('countDown', (opponent: string, lobby: number) => {
				getOpponentData(opponent, lobby);
			});
			socket.on('roundStart', (x: number, y: number) => {
				setBall({x: x, y: y});
			});
		}
		else if (status === "In Game")
		{
			socket.on('roundStart', (x: number, y: number) => {
				setBall({x: x, y: y});
			});
			socket.on('ballMoved', (x: number, y: number, speed: number) => {
				setBall({x: x, y: y});
				setSpeed(speed);
			});
			socket.on('playerScored', (newScore: {x: number, y: number}) => {
				setScores(newScore);
				if (newScore.x !== 11 && newScore.y !== 11)
					socket.emit('nextRound', dataGame.id);
				else 
				{
					if (newScore.x === 11)
						socket.emit('resignGame', dataGame.id, name);
					setStatus("In Postmatch");
				}
			});
			socket.on('paddleMoved', (y: number, playerName: string) => {
				if (playerName !== name)
					setPaddleRightY(y);
			});
		}
		else
		{
			setGamePaused(null);
			socket.off('pauseState');
			socket.off('gameResigned');
			socket.off('Match starts soon');
			socket.off('roundStart');
			socket.off('ballMoved');
			socket.off('countDown');
			socket.off('playerScored');
			socket.off('paddleMoved');
		}
	}, [status]);
	return (
		<GameContext.Provider value={{ isAmical, setIsAmical, userSimpleStat, setUserSimpleStat, userDoubleStat, setUserDoubleStat, paddleRightY, gamePaused, setGamePaused, ball, setBall, prevBadges, setPrevBadges, pauseAsked, setPauseAsked, showMode, setShowMode, scores, setScores, dataGame, setDataGame, direction, setDirection, speed, setSpeed, elapsedSeconds, setElapsedSeconds, targetState, setTargetState, dataOpponent, setDataOpponent, endGameInfo, setEndGameInfo }}>
			{children}
		</GameContext.Provider>);
};
