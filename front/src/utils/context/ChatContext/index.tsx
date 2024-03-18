import { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import Admin from '../../../assets/images/chat/admin.svg';
import ArrowDown from '../../../assets/images/chat/arrow-down.svg';
import ArrowLeft from '../../../assets/images/chat/arrow-left.svg';
import Crown from '../../../assets/images/chat/crown.svg';
import Edit from '../../../assets/images/chat/edit.svg';
import HidePass from '../../../assets/images/chat/hidePass.svg';
import Mask from '../../../assets/images/chat/mask.svg';
import Private from '../../../assets/images/chat/private.svg';
import Public from '../../../assets/images/chat/public.svg';
import ShowPass from '../../../assets/images/chat/showPass.svg';
import User from '../../../assets/images/chat/user.svg';
import Warning from '../../../assets/images/chat/warning.svg';
import { ProfileContext } from '../ProfileContext';
import axios from 'axios';
import Cookies from 'js-cookie';
import { SoundContext } from '../SoundContext';
import { WebSocketContext } from '../WebSocketContext';
import { GameContext } from '../GameContext';

type ChatContextType = {
	gameInvite: string[];
	setGameInvite: (value: string[]) => void;
	talk?: { pfp: string, name: string; isGroup: boolean; isOwner?: boolean };
	setTalk: (value?: { pfp: string, name: string; isGroup: boolean; isOwner?: boolean }) => void;
	talkSearched: boolean;
	setTalkSearched: (value: boolean) => void;
	showGroupInfo: boolean;
	setShowGroupInfo: (value: boolean) => void;
	showIdCard: number;
	setShowIdCard: (value: number) => void;
	handleSVG: (value: string) => string | undefined;
	chatList: {pfp: string, name: string; status?: string; isGroup: boolean; nbUser?: number; capacity?: number, isOwner?: boolean}[];
	setChatList: (value: {pfp: string, name: string; status?: string; isGroup: boolean; nbUser?: number; capacity?: number, isOwner?: boolean}[]) => void;
	listLoading: string;
	setListLoading: (value: string) => void;
	userChat: {type: string, time?: string, userPfp?: string, username?: string, msg: string, groupName?: string}[];
	setUserChat: (value: {type: string, time?: string, userPfp?: string, username?: string, msg: string, groupName?: string}[]) => void;
	newMessage: (newType: string, newPfp: string, newMsg: string, roomName: string) => void;
	chatNotif: Map <string, number>;
	setChatNotif: (value: {groupName: string, nbMsgs: number}[]) => void;
	refreshGroupInfo: boolean;
	setRefreshGroupInfo: (value: boolean) => void;
	setRefreshFriends: (value: boolean) => void;
	logout: boolean;
	setLogout: (value: boolean) => void;
	setRefreshNotifs: (value: boolean) => void;
	namesDisplay: {name: string, nameDisplay: string}[];
	setNamesDisplay: (value: {name: string, nameDisplay: string}[]) => void;
};

export const ChatContext = createContext<ChatContextType>({
	gameInvite: [],
	setGameInvite: () => {},
	talk: undefined,
	setTalk: () => {},
	talkSearched: false,
	setTalkSearched: () => {},
	showGroupInfo: false,
	setShowGroupInfo: () => {},
	showIdCard: -1,
	setShowIdCard: () => {},
	handleSVG: () => undefined,
	chatList: [],
	setChatList: () => {},
	listLoading: true,
	setListLoading: () => {},
	userChat: [],
	setUserChat: () => {},
	newMessage: () => {},
	chatNotif: new Map(),
	setChatNotif: () => {},
	refreshGroupInfo: true,
	setRefreshGroupInfo: () => {},
	setRefreshFriends: () => {},
	logout: false,
	setLogout: () => {},
	setRefreshNotifs: () => {},
	namesDisplay: [],
	setNamesDisplay: () => {},
});

export const ChatProvider = ({ children }: { children: ReactNode }) => {
	const { dataGame, setDataGame } = useContext(GameContext);
	const [ gameInvite, setGameInvite ] = useState<string[]>([]);
	const { socket, token, headers } = useContext(WebSocketContext);
	const [ talk, setTalk ] = useState<{pfp: string, name: string, isGroup: boolean, isOwner?: boolean} | undefined>(undefined);
	const { logged, setStatus } = useContext(ProfileContext);
	const [ showGroupInfo, setShowGroupInfo ] = useState<boolean>(false);
	const [ showIdCard, setShowIdCard ] = useState<number>(-1);
	const [ talkSearched, setTalkSearched ] = useState(false);
	const [ chatList, setChatList ] = useState<{pfp: string, name: string, status?: string, isGroup: boolean, nbUser?: number, capacity?: number, isOwner?: boolean}[]>([]);
	const tab = [{name: "admin", svg: Admin}, {name: "arrow-down", svg: ArrowDown}, {name: "arrow-left", svg: ArrowLeft},
	{name: "crown", svg: Crown}, {name: "edit", svg: Edit}, {name: "hidePass", svg: HidePass}, {name: "mask", svg: Mask},
	{name: "private", svg: Private}, {name: "public", svg: Public}, {name: "showPass", svg: ShowPass}, {name: "user", svg: User}, {name: "warning", svg: Warning}];
	const [listLoading, setListLoading ] = useState(true);
	const { handleSFX } = useContext(SoundContext);
	const { name, pfp, setFriendRequest, setProfileNotif, setLogged, setFriendsData } = useContext(ProfileContext);
	const [ userChat, setUserChat ] = useState<{type: string, time?: string, userPfp?: string, username?: string, msg: string, groupName?: string}[]>([]);
	const clock = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	const [ messageReceived, setMessageReceived ] = useState<{type: string, time?: string, userPfp?: string, username?: string, msg: string, groupName?: string, nbUsers: number} | undefined>(undefined);
	const [ addInfo, setAddInfo ] = useState<{action?: string, name: string, adminName: string, isJoin: boolean, isOwner: boolean} | undefined>(undefined);
	const [ groupData, setGroupData ] = useState<{pfp: string, name: string, status?: string, isGroup: boolean, nbUser?: number, capacity?: number, isOwner?: boolean} | undefined>(undefined);
	const [ newRequest, setNewRequest ] = useState<{name: string, pfp: string} | undefined>(undefined);
	const [ chatNotif, setChatNotif ] = useState<Map<string, number>>(new Map());
	const [ removedBy, setRemovedBy ] = useState<string>("");
	const [ refreshGroupInfo, setRefreshGroupInfo ] = useState<boolean>(true);
	const [ refreshFriends, setRefreshFriends ] = useState<boolean>(false);
	const [ logout, setLogout ] = useState<boolean>(false);
	const [ loaded, setLoaded ] = useState<boolean>(false);
	const [refreshNotifs, setRefreshNotifs] = useState<boolean>(false);
	const [ namesDisplay, setNamesDisplay ] = useState<{name: string, nameDisplay: string}[]>([]);

	const handleSVG = (name: string) => {
		const index = tab.findIndex((item) => item.name === name);
		return (tab[index].svg);
	};
	useEffect(() => {
		const getChats = async () => {
			axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/get-chats', { headers })
			.then((chatResponse: any) => {
				setChatList(chatResponse.data);
				setNamesDisplay(chatResponse.data.map((chat: any) => ({
					name: chat.name,
					nameDisplay: chat.nameDisplay
				})));
				setListLoading(false);
			}).catch((error: any) => {
				console.error(error);
			});
		}
		if (token && logged)
			getChats();
	}, [token, logged]);
	const setChats = async () => {
		await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/set-chats', { chatList }, { headers });
	};
	useEffect(() => {
		if (logged && name !== "notConnected")
			socket.emit('checkConnection', name);
	}, [logged]);
	useEffect(() => {
		if (logged && name !== "notConnected")
			socket.emit('userNameUpdated', name, chatList);
	}, [name]);
	const fetchChatNotif = async (isGet: boolean) => {
		if (isGet && logged && name !== "notConnected")
		{
			await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/getChatNotif', { headers })
			.then((chatNotifRes) => {
				if (chatNotifRes.data && chatNotifRes.data.names.length)
				{
					const newChatNotif = new Map<string, number>();
					chatNotifRes.data.names.forEach((chat: string, index: number) => {
						newChatNotif.set(chat, chatNotifRes.data.notifs[index]);
					});
					setChatNotif(newChatNotif);
				}
				setLoaded(true);
			}).catch((error) => {
				console.error(error);
			});
		}
		else if (chatNotif !== undefined && logged && name !== "notConnected")
		{
			const names = Array.from(chatNotif.keys());
			const notifs = Array.from(chatNotif.values());
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateChatNotif', { names: names, notifs: notifs }, { headers });
			setRefreshNotifs(false);
		}
	};
	const fetchGameInvite = async () => {
		await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/getGameInvite', { headers })
		.then((response) => {
			if (response.data && response.data.length)
				setGameInvite(response.data);
		}).catch((error) => {
			console.error(error);
		});
	};
	useEffect(() => {
		fetchGameInvite();
		fetchChatNotif(true);
	}, []);
	useEffect(() => {
		if (loaded && refreshNotifs)
			fetchChatNotif(false);
	}, [refreshNotifs]);
	useEffect(() => {
		if (token && logged && chatList.length && loaded)
		{
			setChats();
			socket.emit('firstConnection', name, chatList);
		}
		if (chatList.length < chatNotif.size && loaded) {
			chatNotif.forEach((value, key) => {
				if (!chatList.some(chat => chat.name === key))
					chatNotif.delete(key);
			});
			setChatNotif(chatNotif);
			setRefreshNotifs(true);
		}
		else if (chatList.length > chatNotif.size && loaded)
		{
			chatList.forEach((chat: any) => {
				if (!chatNotif.has(chat.name))
					chatNotif.set(chat.name, 0);
			});
			setChatNotif(chatNotif);
			setRefreshNotifs(true);
		}
	}, [chatList]);
	useEffect(() => {
		socket.once('lastConnection', () => {
			if (window.location.pathname === "/profile" || window.location.pathname === "/chat")
				setLogout(true);
			Cookies.remove('accessToken');
			setLogged(false);
		});
		socket.once('refreshToken', () => {
			Cookies.set('accessToken', token);
		});
		socket.on('gameInviteCanceled', async (target: string) => {
			if (target)
			{
				const response = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getFriends`, {headers});
				const friend = response.data.find((friend) => friend.name === target);
				if (friend && !chatList.some((chat) => chat.name === friend.name))
				{
					chatList.unshift({pfp: friend.pfp, name: friend.name, status: friend.status, isGroup: false});
					setChatList([...chatList]);
					updateUserChatList(chatList.map((chat) => chat.name));
				}
				const notif = chatNotif.get(friend.name);
				chatNotif.set(friend.name, notif + 1);
				setChatNotif(chatNotif);
				console.log(chatNotif);
				setRefreshNotifs(true);
				setDataGame({mode: undefined, isDouble: undefined, speed: undefined, id: undefined, opponent: undefined});
				setStatus("Online");
			}
			else
				fetchGameInvite();
			setRefreshGroupInfo(true);
		});
		socket.on('newRoomInfo', (prevName: string, newName: string, newCapacity: number, newDescription: string) => {
			setTalk((prevState) => {
				if (prevState !== undefined && prevState.name === prevName)
					return ({...prevState, name: newName});
				return ({...prevState});
			});
			setChatList((prevState) => prevState.map((chat) => chat.name === prevName ? { ...chat, name: newName, capacity: newCapacity, description: newDescription } : chat));
		});
		socket.on('addRequest', (friendName: string, friendPfp: string) => {
			setNewRequest({name: friendName, pfp: friendPfp});
			setProfileNotif(2);
		});
		socket.on('refreshFriends', () => {
			setRefreshFriends(true);
		});
		socket.on('messageFromRoom', (messageData: {type: string, time?: string, userPfp?: string, username?: string, msg: string, groupName?: string, nbUsers?: number}) => {
			if (messageData.groupName && messageData.groupName.length > 10)
			{
				const spaces = ' '.repeat(7);
				const users = messageData.groupName.split(spaces);
				if (name === users[0])
					messageData.groupName = messageData.groupName.split(spaces)[1];
				else
					messageData.groupName = messageData.groupName.split(spaces)[0];
			}
			if (messageData.type === "game" && dataGame.id === undefined && dataGame.opponent === messageData.groupName)
				return ;
			setMessageReceived(messageData);
		});
		socket.on('addRoom', (isJoin: boolean, userName: string, groupInfo: {pfp: string, name: string; status?: string; isGroup: boolean; nbUser?: number; capacity?: number, isOwner: boolean}) => {
			setGroupData(groupInfo);
			setAddInfo({action: undefined, name: userName, isJoin: isJoin});
		});
		socket.on('goodBye', (action: string, userName: string, roomName: string, adminName: string, nbUsers: number) => {
			if (name === userName)
			{
				setGroupData({name: roomName, status: undefined, isGroup: true, nbUser: nbUsers, capacity: undefined});
				setAddInfo({action: action, name: userName, adminName: adminName, isJoin: false});
			}
		});
		socket.on('removedBy', (userName: string) => {
			setRemovedBy(userName);
			setChatList((prevState) => prevState.filter((chat: any) => chat.name !== userName));
			setFriendsData((prevState) => prevState.filter((friend: any) => friend.name !== userName));
			setRefreshGroupInfo(true);
		});
	}, []);
	const fetchDataFriends = async () => {
		try {
			const response = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getFriends`, {headers});
			setFriendsData(response.data);
			chatList.forEach((chat: any) => {
				if (!chat.isGroup)
				{
					const friend = response.data.find((friend: any) => friend.name === chat.name);
					if (chat.status !== friend.status)
					{
						chat.status = friend.status;
						setChatList((prevState: any) => prevState.map((item: any) => item.name === chat.name ? chat : item));
					}
				}
			});
			const resquestRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + '/user/friendRequest', { headers });
			setFriendRequest(resquestRes.data);
			setRefreshFriends(false);
		} catch (error) {
			console.error(error);
		}
	};
	useEffect(() => {
		if (refreshFriends)
			fetchDataFriends();
	}, [refreshFriends]);
	useEffect(() => {
		if (talk !== undefined && talk.name === removedBy)
			setTalk(undefined);
	}, [removedBy]);
	const leavingRoom = async (roomName: string) => {
		await axios.delete(process.env.REACT_APP_URL_LOCAL_BACK + '/user/leaving-group', {params: { roomName: roomName }, headers });
	}
	const banUser = async (userName: string, roomName: string) => {
		await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/chat/ban', { userName : userName, roomName: roomName }, { headers });
	};
	const newMessage = async (newType: string, newMsg: string, roomName: string) => {
		const messageData = {type: newType, time: clock, userPfp: pfp, username: name, msg: newMsg, groupName: roomName};
		socket.emit('messageToRoom', messageData);
		await axios.post(process.env.REACT_APP_URL_LOCAL_BACK + '/user/message', messageData, { headers });
		await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/user/setChatNotif', { roomName: messageData.groupName }, { headers });
	};
	useEffect(() => {
		if (groupData !== undefined && addInfo !== undefined && addInfo.action !== undefined)
		{
			leavingRoom(groupData.name);
			chatNotif.delete(groupData.name);
			setChatNotif(chatNotif);
			setRefreshNotifs(true);
			setTalk(undefined);
			const index = chatList.findIndex((item) => item.name === groupData.name);
			chatList.splice(index, 1);
			setChatList([...chatList]);
			socket.emit('leave', groupData.name);
			if (addInfo.action === 'kick' || addInfo.action === 'ban')
				newMessage("flux", `#${name} has been ${addInfo.action === 'kick' ? 'kicked' : 'banned'} by #${addInfo.adminName}`, groupData.name)
			else if (groupData.nbUser > 1)
				newMessage("flux", `#${name} left ${groupData.name}`, groupData.name);
			if (addInfo.action === 'ban')
				banUser(addInfo.name, groupData.name);
			setGroupData(undefined);
			setAddInfo(undefined);
		}
		else if (groupData !== undefined && addInfo !== undefined && addInfo.action === undefined)
		{
			setTalk({pfp: groupData.pfp, name: groupData.name, isGroup: true, isOwner: groupData.isOwner});
			chatList.unshift(groupData);
			setChatList([...chatList]);
			newMessage("flux", `#${addInfo.name} ${addInfo.isJoin? 'joined' : 'created'} ${groupData.name}`, groupData.name)
			setGroupData(undefined);
			setAddInfo(undefined);
		}
	}, [groupData, addInfo]);
	const updateUserChatList = async (list: string[]) => {
			await axios.patch(process.env.REACT_APP_URL_LOCAL_BACK + '/user/updateChatList', { list: list}, { headers });
	};
	const fetchNewFriendNewMsg = async () => {
		const friendsRes = await axios.get(process.env.REACT_APP_URL_LOCAL_BACK + `/user/getFriends`, {headers});
		const friendData = friendsRes.data ? friendsRes.data.find((friend: any) => friend.name === messageReceived.groupName) : [];
		if (friendsRes.data && friendsRes.data.length && !chatList.find((chat) => chat.name === friendData.name))
		{
			chatList.unshift({pfp: friendData.pfp, name: friendData.name, status: friendData.status, isGroup: false});
			setChatList([...chatList]);
			updateUserChatList(chatList.map((chat) => chat.name));
			chatNotif.set(friendData.name, 1);
			setChatNotif(chatNotif);
			setRefreshNotifs(true);
			setFriendsData(friendsRes.data);
		}
	};
	useEffect(() => {
		if (messageReceived !== undefined)
		{
			if (messageReceived.type !== "date")
			{
				if (messageReceived.type === "game" && messageReceived.msg.split(' ')[0] !== name)
					fetchGameInvite();
				if (talk?.name === messageReceived.groupName && messageReceived.type === "flux")
					setRefreshGroupInfo(true);
				if (chatList.find((chat) => chat.name === messageReceived.groupName))
				{
					const chatData = chatList.find((chat) => chat.name === messageReceived.groupName);
					const updatedChat = [{...chatData, nbUser: messageReceived.nbUsers !== undefined ? messageReceived.nbUsers : chatData.nbUsers}
										, ...chatList.filter((chat) => chat.name !== messageReceived.groupName)];
					setChatList(updatedChat);
					updateUserChatList(updatedChat.map((chat) => chat.name));
				}
				else if (messageReceived.type !== "flux")
					fetchNewFriendNewMsg();
				if ((talk === undefined || talk.name !== messageReceived.groupName || showGroupInfo || showIdCard !== -1) && chatList.some((chat: any) => chat.name === messageReceived.groupName))
				{
					const notif = chatNotif.get(messageReceived.groupName);
					if (!notif)
						handleSFX("notif");
					chatNotif.set(messageReceived.groupName, notif + 1);
					setChatNotif(chatNotif);
					setRefreshNotifs(true);
				}
			}
			if (talk?.name === messageReceived.groupName && messageReceived.type === "msg" && userChat[userChat.length - 1]?.type === "msg" && messageReceived.username === userChat[userChat.length - 1]?.username && messageReceived.time === userChat[userChat.length - 1]?.time) {
				setUserChat((prev: any) => [...prev.slice(0, prev.length - 1),
					{
						...prev[prev.length - 1],
						msg: prev[prev.length - 1].msg.concat("\n", messageReceived.msg),
					},
				]);
			}
			else if (talk?.name === messageReceived.groupName)
				setUserChat((prev: any) => [...prev, messageReceived]);
			setMessageReceived(undefined);
		}
	}, [messageReceived]);
	useEffect(() => {
		if (newRequest !== undefined)
		{
			setFriendRequest((prevState: {name: string, pfp: string}[]) => ([...prevState, newRequest]));
			setNewRequest(undefined);
		}
	}, [newRequest]);
	return (
		<ChatContext.Provider value={{ namesDisplay, setNamesDisplay, fetchGameInvite, setListLoading, setRefreshNotifs, gameInvite, setGameInvite, logout, setLogout, refreshGroupInfo, setRefreshGroupInfo, socket, userChat, setUserChat, newMessage, chatNotif, setChatNotif, setRefreshFriends, talk, setTalk, talkSearched, setTalkSearched, showGroupInfo, setShowGroupInfo, showIdCard, setShowIdCard, handleSVG, chatList, setChatList, listLoading }}>
			{children}
		</ChatContext.Provider>);
};
