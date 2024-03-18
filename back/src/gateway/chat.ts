import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UserService } from '../user/user.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
	cors: {
		origin: process.env.URL_LOCAL_FRONT,
	  }
})

export class ChatServer implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	constructor(private readonly userService: UserService) {}
	private allSockets: Map <string, Socket> = new Map();
	private chatRooms: Map <string, {client: Socket, name: string}[]> = new Map();
	private pendingGamesInvite: Map <string, string> = new Map();

	handleJoinEvent(client: Socket, roomName: string, name: string) {
		client.join(roomName);
		if (!this.chatRooms.has(roomName))
		{
			const Sockets = [];
			Sockets.push({client: client, name: name});
			this.chatRooms.set(roomName, Sockets);
		}
		else
			this.chatRooms.get(roomName).push({client: client, name: name});
	}
	getFriendRoomName(user1: string, user2: string) {
		const spaces = ' '.repeat(7);
		if (this.chatRooms.has(`${user1}${spaces}${user2}`))
			return (`${user1}${spaces}${user2}`);
		return (`${user2}${spaces}${user1}`);
	};
	afterInit(server: Server) {
		const scheduleEmit = async () => {
			const currentDate = new Date();
			const currentHour = currentDate.getHours();
			if (currentHour === 23)
			{
				const date = currentDate.toLocaleString('en-US', { month: 'short', day: '2-digit' })
				await this.userService.sendDate(date);
				server.emit('messageFromRoom', { type: "date", msg: date});
			}
			const nextExecution = new Date();
			nextExecution.setHours(23, 0, 0, 0);
			if (nextExecution <= currentDate)
				nextExecution.setDate(nextExecution.getDate() + 1);
			const timeUntilNextExecution = nextExecution.getTime() - currentDate.getTime();
			setTimeout(scheduleEmit, timeUntilNextExecution);
		};
		scheduleEmit();
	}
	handleConnection(client: Socket) {
		client.once('firstConnection', (name: string, chats: {name: string, status?: string, isGroup: boolean, nbUser?: number, capacity?: number}[]) => {
			for (const chat of chats)
			{
				const roomName = chat.isGroup ? chat.name : this.getFriendRoomName(name, chat.name);
				const room = this.chatRooms.get(roomName);
				if (room !== undefined)
				{
					client.join(roomName);
					this.chatRooms.set(roomName, room.map((user) => user.name === name ? { ...user, client: client } : user));
				}
			}
		});
		client.on('roomNameUpdated', (prevName: string, newName: string, newCapacity: number, newDescription: string) => {
			this.server.to(prevName).emit('newRoomInfo', prevName, newName, newCapacity, newDescription);
			const room = this.chatRooms.get(prevName);
			if (room !== undefined)
			{
				for (const user of room)
				{
					user.client.leave(prevName);
					user.client.join(newName);
				}
				this.chatRooms.delete(prevName);
				this.chatRooms.set(newName, room);
			}
		});
		client.once('checkConnection', (name: string) => {
			const existingSocket = this.allSockets.get(name);
			if (existingSocket !== undefined && existingSocket !== client)
			{
				existingSocket.emit('lastConnection');
				existingSocket.removeAllListeners();
				existingSocket.disconnect();
			}
			this.allSockets.set(name, client);
			client.emit('refreshToken');
		});
		client.on('userNameUpdated', (name: string, chats: {name: string, status?: string, isGroup: boolean, nbUser?: number, capacity?: number}[]) => {
			for (const chat of chats)
			{
				const roomName = chat.isGroup ? chat.name : this.getFriendRoomName(name, chat.name);
				const room = this.chatRooms.get(roomName);
				if (room !== undefined)
					this.chatRooms.set(roomName, room.map((user) => user.client === client ? { ...user, name: name } : user));
			}
		});
		client.on('addFriend', (recipientName: string, friendName: string, friendPfp: string) => {
			const friendSocket = this.allSockets.get(recipientName);
			if (friendSocket)
				friendSocket.emit('addRequest', friendName, friendPfp);
		});
		client.on('removeFriend', (userName: string, friendName: string) => {
			const roomName = this.getFriendRoomName(userName, friendName);
			const userSocket = this.allSockets.get(userName);
			const friendSocket = this.allSockets.get(friendName);
			if (userSocket !== undefined)
				userSocket.leave(roomName);
			if (friendSocket)
			{
				friendSocket.leave(roomName);
				friendSocket.emit('removedBy', userName);
			}
			this.chatRooms.delete(roomName);
		});
		client.on('newFriendInfo', (friends: string[]) => {
			for (const user of this.allSockets)
			{
				if (friends.includes(user[0]))
					user[1].emit('refreshFriends');
			}
		});
		client.on('messageToRoom', (messageData: {type: string, time: string, userPfp: string, username: string, msg: string, groupName: string}) => {
			if (!this.chatRooms.has(messageData.groupName))
			{
				const roomName = this.getFriendRoomName(messageData.username, messageData.groupName);
				const newMessageData = {...messageData, groupName: roomName};
				this.server.sockets.to(roomName).emit('messageFromRoom', newMessageData);
			}
			else
			{
				const nbUsers = this.chatRooms.get(messageData.groupName).length;
				const newMessageData = {...messageData, nbUsers: nbUsers};
				this.server.sockets.to(messageData.groupName).emit('messageFromRoom', newMessageData);
			}
		});
		client.on('joinRoom', (groupPfp: string, isJoin: boolean, username: string, roomName: string, capacity: number) => {
			this.handleJoinEvent(client, roomName, username);
			if (!groupPfp && !isJoin && !capacity)
			{
				const spaces = ' '.repeat(7);
				const user2Name = roomName.split(spaces)[1];
				const user2Socket = this.allSockets.get(user2Name);
				if (user2Socket !== undefined)
					this.handleJoinEvent(user2Socket, roomName, user2Name);
			}
			else
			{
				const nbUsers = this.chatRooms.get(roomName).length;
				client.emit('addRoom', isJoin, username, {pfp: groupPfp, name: roomName, status: undefined, isGroup: true, nbUser: nbUsers, capacity: capacity, isOwner: (isJoin ? false : true)});
			}
		});
		client.on('leave', async (roomName: string) => {
			const room = this.chatRooms.get(roomName);
			if (room !== undefined) {
				if (room.length === 1)
					this.chatRooms.delete(roomName);
				else
					this.chatRooms.set(roomName, room.filter((user) => user.client !== client));
				client.leave(roomName);
			}
		});
		client.on('sayGoodBye', (action: string, userName: string, roomName: string, adminName: string) => {
			const room = this.chatRooms.get(roomName);
			if (room !== undefined)
				this.server.to(roomName).emit('goodBye', action, userName, roomName, adminName, room.length);
		})
		client.on('muteState', async (roomName: string, userPfp: string, userName: string, mess: string) => {
			const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			const nbUsers = this.chatRooms.get(roomName).length;
			const messageData = {type: "flux", time: time, userPfp: userPfp, username: userName, msg: mess, groupName: roomName, nbUsers: nbUsers};
			this.server.sockets.to(roomName).emit('messageFromRoom', messageData);
			await this.userService.sendGroupMessageToDb(messageData, userName, roomName);
		});
		client.on('roleState', async (roomName: string, userPfp: string, userName: string, mess: string) => {
			const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
			const nbUsers = this.chatRooms.get(roomName).length;
			const messageData = {type: "flux", time: time, userPfp: userPfp, username: userName, msg: mess, groupName: roomName, nbUsers: nbUsers};
			this.server.sockets.to(roomName).emit('messageFromRoom', messageData);
			await this.userService.sendGroupMessageToDb(messageData, userName, roomName);
		});
		client.on('gameInvite', (username: string, target: string) => {
			this.pendingGamesInvite.set(username, target);
		});
		client.on('updateInvite', (username: string, target: string, state: string, decliner: string) => {
			const targetSocket = this.allSockets.get(target);
			if (targetSocket !== undefined)
			{
				this.userService.updateGameInvite(username, state);
				targetSocket.emit('gameInviteCanceled', decliner);
				this.pendingGamesInvite.delete(username);
			}
		});
		client.on('gameFinished', (username: string, scores: {x: number, y: number}) => {
			if (this.pendingGamesInvite.has(username))
			{
				const msg = `${scores.x}-${scores.y}`
				this.userService.updateGameInvite(username, msg);
				this.pendingGamesInvite.delete(username);
			}
		});
	}
	handleDisconnect(client: Socket): any {
		client.removeAllListeners();
		for (const [ roomName, room ] of this.chatRooms.entries())
			client.leave(roomName);

		for (const [allSocketsKey, allSocketsClient] of this.allSockets.entries()) {
			if (allSocketsClient === client)
			{
				const target = this.pendingGamesInvite.get(allSocketsKey);
				if (target && target !== undefined)
				{
					const targetSocket = this.allSockets.get(target);
					this.userService.updateGameInvite(allSocketsKey, "Canceled");
					targetSocket.emit('gameInviteCanceled', null);
					this.pendingGamesInvite.delete(allSocketsKey);
				}
				this.userService.refreshOfflineStatus(allSocketsKey);
				this.server.emit('refreshFriends');
			}
		}
	}
}
