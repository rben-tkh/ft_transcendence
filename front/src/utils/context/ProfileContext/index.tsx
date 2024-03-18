import { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import Unknown from "../../../assets/images/achievements/Unknown.png"
import PongPioneer from "../../../assets/images/achievements/PongPioneer.png"
import SimpleAdept from "../../../assets/images/achievements/SimpleLegend.png"
import DoubleAdept from "../../../assets/images/achievements/DoubleLegend.png"
import SimpleVeteran from "../../../assets/images/achievements/SimpleVeteran.png"
import DoubleVeteran from "../../../assets/images/achievements/DoubleVeteran.png"
import PongPerfectionist from "../../../assets/images/achievements/PongPerfectionist.png"
import axios from 'axios';
import { GameContext } from '../GameContext';
import { WebSocketContext } from '../WebSocketContext';

type ProfileContextType = {
	tfa: string;
	setTfa: (value: string) => void;
	logged: boolean;
	setLogged: (value: boolean) => void;
	name: string;
	setName: (value: string) => void;
	nameDisplay: string;
	setNameDisplay: (value: string) => void;
	status: string;
	setStatus: (value: string) => void;
	showMatchHistory: boolean;
	setShowMatchHistory: (value: boolean) => void;
	warningType: {type: string, component: string};
	setWarningType: (value: {type: string, component: string}) => void;
	userAchievement: number[];
	setUserAchievement: (value: number[]) => void;
	achievements: { title: string, picture: string, description: string }[];
	handleBadge: (value: string) => { title: string, picture: string | undefined, description: string };
	friendsData: { name: string, status: string, pfp: string}[];
	setFriendsData: (value: { pfp: string, name: string, status: string}[]) => void;
	setBadgeIdx: (badge: { title: string, picture: string | undefined, description: string }) => void;
	badgeIdx: { title: string, picture: string | undefined, description: string };
	pfp: string;
	setpfp: (value: string) => void;
	friendRequest: {name: string, pfp: string}[];
	setFriendRequest: (value: {name: string, pfp: string}[]) => void;
	profileNotif: number;
	setProfileNotif: (value: number) => void;
	blocked: string[];
	setBlocked: (value: string[]) => void;
};

export const ProfileContext = createContext<ProfileContextType>({
	tfa: "disable",
	setTfa: () => {},
	logged: false,
	setLogged: () => {},
	name: "Guest",
	setName: () => {},
	nameDisplay: '',
	setNameDisplay: () => {},
	status: "Online",
	setStatus: () => {},
	showMatchHistory: false,
	setShowMatchHistory: () => {},
	warningType: {type: "", component: ""},
	setWarningType: () => {},
	userAchievement: [0],
	setUserAchievement: () => {},
	achievements: [{ title: "Unknown", picture: "Unknown", description: "???" }],
	handleBadge: () => ({ title: "Unknown", picture: "Unknown", description: "???" }),
	friendsData: [{ name: "", status: "" , pfp: ""}],
	setFriendsData: () => {},
	setBadgeIdx: () => {},
	badgeIdx: { title: "", picture: "", description: "" },
	pfp: "",
	setpfp: () => {},
	friendRequest: [],
	setFriendRequest: () => {},
	profileNotif: -1,
	setProfileNotif: () => {},
	blocked: [],
	setBlocked: () => {},
});

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
	const { token, headers, socket } = useContext(WebSocketContext);
	const { dataGame } = useContext(GameContext);
	const initialTfa = localStorage.getItem('tfa');
	const [tfa, setTfaState] = useState<string>(initialTfa ? JSON.parse(initialTfa) : "disable");
	const initialLogged = localStorage.getItem('logged');
	const [logged, setLoggedState] = useState<boolean>(initialLogged ? JSON.parse(initialLogged) : false);
	const initialName = localStorage.getItem('name');
	const [name, setNameState] = useState(initialName ? JSON.parse(initialName) : "notConnected");
	const [ nameDisplay, setNameDisplay ] = useState('');
	const initialpfp = localStorage.getItem('pfp');
	const [pfp, setpfpState] = useState(initialpfp ? JSON.parse(initialpfp) : "");
	const initialStatus = localStorage.getItem('status');
	const [status, setStatusState] = useState<string>(initialStatus && dataGame.mode !== undefined ? JSON.parse(initialStatus) : "Online");
	const [showMatchHistory, setShowMatchHistory] = useState(false);
	const [ warningType, setWarningType ] = useState<{type: string, component: string}>({type: '', component: ''});
	const [ userAchievement, setUserAchievement ] = useState([0]);
	const achievements = [{index: -1, title: "Unknown", picture: Unknown, description: "???"},
	{index: 0, title: "Pong Pioneer", picture: PongPioneer, description: "Sign in for the first time."},
	{index: 1, title: "Simple Adept", picture: SimpleAdept, description: "Reach Adept rank with solo option."},
	{index: 2, title: "Double Adept", picture: DoubleAdept, description: "Attain Adept rank with double option."},
	{index: 3, title: "Simple Veteran", picture: SimpleVeteran, description: "Complete 11 solo games."},
	{index: 4, title: "Double Veteran", picture: DoubleVeteran, description: "Play 11 double matches."},
	{index: 5, title: "Pong Perfectionist", picture: PongPerfectionist, description: "Win a game with a perfect of 11-0 scores."}];
	const [ badgeIdx, setBadgeIdx ] = useState(0);
	const [ friendsData, setFriendsData ] = useState([]);
	const [ friendRequest, setFriendRequest ] = useState<{name: string, pfp: string}[]>([]);
	const [ profileNotif, setProfileNotif ] = useState<number>(-1);
	const [ blocked, setBlocked ] = useState<string[]>([]);

	const setTfa = (value: string) => {
		localStorage.setItem('tfa', JSON.stringify(value));
		setTfaState(value);
	};
	const setLogged = (value: boolean) => {
		localStorage.setItem('logged', JSON.stringify(value));
		setLoggedState(value);
	};
	const setName = (value: string) => {
		localStorage.setItem('name', JSON.stringify(value));
		setNameState(value);
	};
	const handleBadge = (name: string) => {
		const index = achievements.findIndex((item) => item.title === name);
		return (achievements[index]);
	}
	const setStatus = (value: string) => {
		localStorage.setItem('status', JSON.stringify(value));
		setStatusState(value);
	};
	const setpfp = (value: string) => {
		localStorage.setItem('pfp', JSON.stringify(value));
		setpfpState(value);
	};
	
	const fetchUserData = async () => {
		try {
			// Récupérer le nom et la photo de profile
			const response = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getUserData`, { params: { name: name}, headers })
			if (response.data)
			{
				setName(response.data.name);
				setNameDisplay(response.data.nameDisplay)
				setpfp(response.data.pfp);
				setUserAchievement(response.data.achievements);
				setBadgeIdx(response.data.badgeIdx);
			}
			// Récupérer les bloqués
			const blockedRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getBlocked`, { headers });
			setBlocked(blockedRes.data);
			// Récupérer les friends
			const friendsRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getFriends`, {headers});
			setFriendsData(friendsRes.data);
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + `/user/updateStatus`, { status: "Online" }, { headers })
			socket.emit('newFriendInfo', friendsRes.data.map((friend) => friend.name));
			// Récupérer les friend requests
			const resquestRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/friendRequest`, { headers });
			setFriendRequest(resquestRes.data);
			const notifRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getProfileNotif`, { headers });
				setProfileNotif(notifRes.data);
			//Login if no 2fa
			if (tfa !== "enable")
				setLogged(true);
			if (name === "notConnected")
				window.location.reload();
		} catch (error) {
			console.error('Erreur lors de la récupération des données utilisateur', error);
		}
	};
	useEffect(() => {
		const handleDisable = async () => {
			await axios.patch(
				process.env.REACT_APP_URL_LOCAL_BACK + `/user/turn-off`,
				{ state: false },
				{ withCredentials: true, headers }
			)
			.then(response => {
				if (response.data.message === 'Disabled 2FA') {
					setTfa("disable");
				}
			})
			.catch(err => {
				console.error('Error disabling 2FA:', err);
			});
		}
		if (token)
		{
			fetchUserData();
			if (tfa === "checking" || tfa === "canceled")
				handleDisable();
		}
	}, []);
	useEffect(() => {
		if (token && tfa !== "enable")
			fetchUserData();
	}, [token]);
	return (<ProfileContext.Provider value={{ nameDisplay, setNameDisplay, blocked, setBlocked, tfa, setTfa, logged, setLogged, name, setName, status, setStatus, showMatchHistory, setShowMatchHistory, warningType, setWarningType, userAchievement, setUserAchievement, achievements, handleBadge, friendsData, setFriendsData, badgeIdx, setBadgeIdx, pfp , setpfp, friendRequest, setFriendRequest, profileNotif, setProfileNotif }}>
		{children}
	</ProfileContext.Provider>);
};
