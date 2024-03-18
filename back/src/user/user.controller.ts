// user/user.controller.ts
import { BadRequestException, Body, Controller, Get, Delete, NotFoundException, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { User } from '@prisma/client';
import JwtAuthenticationGuard from "../jwt-guard/jwt-guard.guard";
import { JwtService } from '@nestjs/jwt';
import { CreateMessageDto } from './createMessgeDto';
import { FormDataDto } from './formDataDto';
import * as bcrypt from 'bcrypt';

@Controller('user')
export class UserController {
constructor(private readonly userService: UserService,
	private readonly JwtService: JwtService,
	private readonly prisma: PrismaService) {}

	@Post('addUser')
	@UseGuards(JwtAuthenticationGuard)
	async addUser(@Body('targetName') targetName: string, @GetUser() user: any) {
		try {
			const target = await this.userService.getUserByName(targetName);
			const getFriendsPerm = await this.prisma.user.findUnique({
				where: { id: user.id },
				include: { friends: true },
			});
			if (targetName.length <= 2)
				return ("Username Too Short") ;
			else if (!target)
				return ("User Not Found");
			else if (target.name === user.name)
				return ("Can't Add Yourself");
			else if (getFriendsPerm.friends.some((friend: any) => friend.friendname === targetName))
				return ("Already Friends");
			else if (getFriendsPerm.blocked.includes(targetName))
				return ("User Blocked");
			else if (target.blocked.includes(user.name) || target.rejectAuto)
				return ("Fake");
			else if (user.friendRequest.includes(target.name))
				return ("Friend Accepted!");
			else if (target.friendRequest.includes(user.name))
				return ("Request Already Sent");
			else if (!target.friendRequest.includes(user.name) && !target.blocked.includes(user.name))
			{
				await this.prisma.user.update({
					where: { id: target.id },
					data: {
							friendRequest: [...target.friendRequest, user.name]
						},
					});
				return ("Invitation Sent!");
			}
		} catch (error: any) {
			throw error;
		}
	}

	@Get('friendRequest')
	@UseGuards(JwtAuthenticationGuard)
	async friendRequest(@Req() req: Request) {
		const user = await this.userService.getUserByName(req.user.name);
		if (!user) {
			throw new BadRequestException('Utilisateur non trouvé');
		} else if (!user.friendRequest.length) {
			return [];
		}
		const friendRequests = await Promise.all(user.friendRequest.map(async (friendName) => {
			const friend = await this.userService.getUserByName(friendName);
			return {
				name: friend.name,
				pfp: friend.pfp_url,
			};
		}));
		return friendRequests;
	}

	@Post('updateFriendRequest')
	@UseGuards(JwtAuthenticationGuard)
	async updateFriendRequest(@Body('friendName') friendName: string, @Body('action') action: string, @Req() req: Request) {
		const user = await this.userService.getUserById(req.user.id);
		const friend = await this.userService.getUserByName(friendName);
		if (!user || !friend || user.friends.some((friend: any) => friend.friendname === friendName) || action === 'block')
		{
			if (action === 'decline' || action === 'block')
			{
				if (action === 'block')
					this.userService.blockUser(user, friend);
				this.userService.removeFriend(user, friend);
			}
			return (this.prisma.user.update({
				where: { id: user.id },
				data: { friendRequest: user.friendRequest.filter((name: string) => name !== friendName) }
			}));
		}
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				friendRequest: user.friendRequest.filter((name: string) => name !== friendName),
				friends: action === 'accept' ? {
					connectOrCreate: {
						create: {
							friendstatus: friend.invisibleMode ? 'Offline' : friend.state,
							friendname: friend.name,
							friendpfp: friend.pfp_url
						},
						where: { id: friend.id }
					}
				} : undefined
			},
		}),
		await this.prisma.user.update({
			where: { id: friend.id },
			data: {
				friendRequest: friend.friendRequest.filter((name: string) => name !== user.name),
				friends: action === 'accept'? {
					connectOrCreate: {
						create: {
							friendstatus: user.invisibleMode ? 'Offline' : user.state,
							friendname: user.name,
							friendpfp: user.pfp_url
						},
						where: { id: user.id }
					}
				} : undefined
			},
		});
	}

	@Post('removeFriend')
	@UseGuards(JwtAuthenticationGuard)
	async removeFriend(@Body('friendName') friendName: string, @Req() req: Request){
		const user = await this.userService.getUserById(req.user.id);
		const target = await this.userService.getUserByName(friendName);
		if (user.friends.some((friend: any) => friend.friendname === friendName))
		{
			await this.userService.removeFriend(user, target);
			await this.userService.removeFromChatList(user, friendName);
			await this.userService.removeFromChatList(target, user.name);
		}
	}

	@Post('blockFriend')
	@UseGuards(JwtAuthenticationGuard)
	async blockFriend(@Body('friendName') friendName: string, @Req() req: Request) {
		const user = await this.userService.getUserById(req.user.id);
		const target = await this.userService.getUserByName(friendName);
		if (user.friends.some((friend: any) => friend.friendname === friendName))
		{
			await this.userService.removeFriend(user, target);
			await this.userService.removeFromChatList(user, friendName);
			await this.userService.removeFromChatList(target, user.name);
		}
		await this.userService.blockUser(user, target);
	}

	@Patch('unblockUser')
	@UseGuards(JwtAuthenticationGuard)
	async unblockUser(@Body('target') target: string, @Req() req: Request) {
		try {
			return this.prisma.user.update({
				where: { id: req.user.id },
				data: { blocked: req.user.blocked.filter((name: string) => name !== target) },
			});
		} catch(error) {
			console.log("error: ", error);
		}
	}

	@Get('getFriends')
	@UseGuards(JwtAuthenticationGuard)
	async getFriends(@Req() req: Request) {
		const user = await this.prisma.user.findUnique({
			where: { name: req.user.name },
			include: { friends: true }, 
		});
		if (!user)
		{
			console.log("User not found");
			return ([]);
		}
		const userStatus = await this.prisma.user.findMany({
			where: { name: { in: user.friends.map((friend: any) => friend.friendname)}},
			select: { name: true, state: true, invisibleMode: true }
		});
		const friendData = user.friends.map((friend: any) => {
			const friendUser = userStatus.find((user: any) => user.name === friend.friendname);
			return {name: friend.friendname, pfp: friend.friendpfp, status: friendUser.invisibleMode ? 'Offline' : friendUser.state};
		});
		return friendData;
	}

	@Get('getUserData')
	@UseGuards(JwtAuthenticationGuard)
	async getUserData(@Query('name') name: string, @Req() req: Request){
		const user = await this.userService.getUserByName(name === "notConnected" ? req.user.name : name);
		if (!user)
			return (null);
		const simpleGames = await this.prisma.simpleGame.findFirst({
			where: { id: user.id }
		});
		const doubleGames = await this.prisma.doubleGame.findFirst({
			where: { id: user.id }
		});
		const badges = await this.prisma.achievement.findFirst({
			where: { id: user.id }
		});
		return ({name: user.name, nameDisplay: user.nameDisplay, pfp: user.pfp_url, simple: simpleGames, double: doubleGames, achievements: badges.all_index, badgeIdx: badges.selected});
	}

	@Patch('updateName')
	@UseGuards(JwtAuthenticationGuard)
	async updateName(@GetUser() user: User, @Body('newName') newName: string ) {
		const regex = /^[a-zA-Z0-9-_]{2,10}$/;
		const nameExist = await this.prisma.user.findUnique({
			where: { name: newName }
		});
		const nameDisplayExist = await this.prisma.user.findFirst({
			where: { nameDisplay: newName }
		});
		if (nameExist || nameDisplayExist)
			return ("Username Already Taken");
		else if (newName.length < 2)
			return ("Username Too Short");
		else if (!regex.test(newName))
			return ("Invalid Username");
		//update username partout
		return this.prisma.user.update({
			where: { id: user.id },
			data: { nameDisplay: newName },
		});
	}

	@Patch('turn-off')
	@UseGuards(JwtAuthenticationGuard)
	async disableTwoFa(@GetUser() user: any, @Body() body: { state: boolean }) {
	try {
		this.userService.turnOff(user.id);
		return { message: 'Disabled 2FA' };
	} catch {
		throw new BadRequestException();
	}
	}

	@Patch('turn-on')
	@UseGuards(JwtAuthenticationGuard)
	async enableTwoFa(@GetUser() user: any, @Body() body: { state: boolean }) {
	try {
		this.userService.turnOn(user.id);
		return { message: 'Enable 2FA' };
	} catch {
		throw new BadRequestException();
	}
	}

/////////////////////////////////Invisible MODE/////////////////////////////////////

	@Patch('user-state-invisible')
	@UseGuards(JwtAuthenticationGuard)
	async userStateInvisible(@GetUser() user: User, @Body('isInvisible') isInvisible: boolean) {
		return (await this.prisma.user.update({
			where: { id: user.id },
			data: { invisibleMode: !isInvisible }
		}));
	}

/////////////////////////////////Private MODE/////////////////////////////////////

	@Patch('user-state-private')
	@UseGuards(JwtAuthenticationGuard)
	async userStatePrivate(@GetUser() user: User, @Body('isPrivate') isPrivate: boolean) {
		return (await this.prisma.user.update({
			where: { id: user.id },
			data: { privateMode: !isPrivate }
		}));
	}

/////////////////////////////////Private MODE/////////////////////////////////////

	@Patch('user-state-rejectAuto')
	@UseGuards(JwtAuthenticationGuard)
	async userStateRejectAuto(@GetUser() user: User, @Body('isRejectAuto') isRejectAuto: boolean) {
		return (await this.prisma.user.update({
			where: { id: user.id },
			data: { rejectAuto: !isRejectAuto }
		}));
	}

/////////////////////////////////GAME OPTION/////////////////////////////////////


	@Get('get-game-info')
	@UseGuards(JwtAuthenticationGuard)
	async getUserProfile(@GetUser() user:any) {
		await this.prisma.user.findUnique({
		  where: { id: user.id },
		  include: {
			simpleGames: true,
			doubleGames: true,
		  },
		});
		if (!user) {
		  throw new Error('User not found');
		}
		return (user);
	  }

/////////////////////////////////Database/////////////////////////////////////

	@Get('date')
	@UseGuards(JwtAuthenticationGuard)
	async getDate(@Query('name') name: string) {
		const userData = await this.userService.getUserByName(name);
		if (!userData)
			throw new BadRequestException('Utilisateur non trouvé');
		return this.userService.getUserDate(userData.date);
	}

	@Post('message')
	@UseGuards(JwtAuthenticationGuard)
	async message(@Body() createMessageDto: CreateMessageDto, @GetUser() user: any) {
		const roomName = await this.userService.getRoomName(user.name, createMessageDto.groupName);
		await this.prisma.message.updateMany({
			where: { groupName: roomName, lastInvite: true },
			data: { lastInvite: false },
		});
		return (await this.prisma.message.create({
			data: {
				type: createMessageDto.type, 
				time: createMessageDto.time,
				userPfp: user.pfp_url,
				username: user.name,
				msg: createMessageDto.msg,
				groupName: roomName,
				lastInvite: createMessageDto.type === "game" ? true : false,
				user: {
					connect: { id: user.id },
				},
			},
		}));
	}

	@Post('checkRoom')
	@UseGuards(JwtAuthenticationGuard)
	async checkRoom (@Body('formData') formData: {pfp: string, name: string, password: string, capacity: number, description: string}, @Body('isJoin') isJoin: boolean, @Res() res: any, @Req() req: any) {
		const formDataDto = new FormDataDto();
		const user = await this.prisma.user.findUnique({
			where: { id: req.user.id },
			include: { chat: true },
		});
		const room = await this.prisma.chat.findFirst({
			where: {roomName: formData.name },
		});
		const existingUser = await this.userService.getUserByName(formData.name);
		const nameDisplayExist = await this.prisma.user.findFirst({
			where: { nameDisplay: formData.name }
		});
		if (formData.name.length < 2)
			formDataDto.setName(!formData.name.length ? "Requierd" : "Name Too Short");
		else if (!isJoin && (room || existingUser || nameDisplayExist))
			formDataDto.setName("Name Exist");
		else if (isJoin && room && user.chat.some(item => item.roomName === formData.name))
			formDataDto.setName("Group Already Joined");
		else if (isJoin && (!room || (room && room.banned.includes(req.user.name)))) {
			formDataDto.setName("Group Not Found");
			if (formData.password.length && formData.password.length < 4)
				formDataDto.setPassword("Password Too Short");
		}
		else
			formDataDto.setName("ok");
		if ((isJoin && room && room.needPass && !formData.password.length) || (formData.password.length && formData.password.length < 4))
			formDataDto.setPassword(!formData.password.length ? "Requierd" : "Password Too Short");
		else if (isJoin && room && room.needPass && !bcrypt.compareSync(formData.password, room.password))
			formDataDto.setPassword("Bad Password");
		else
			formDataDto.setPassword("ok");
		if (isJoin && room && room.nbUsers >= room.capacity)
			formDataDto.setCapacity("Group Full");
		else if (!isJoin && !formData.capacity)
			formDataDto.setCapacity("Requierd");
		else
			formDataDto.setCapacity("ok");
		if (!isJoin && (formData.description.length && formData.description.length < 6))
			formDataDto.setDescription("Description Too Short");
		else
		{
			if (!formData.description.length)
				formData.description = "Hang out and chat with others in this room!";
			formDataDto.setDescription("ok");
		}
		if (isJoin && room && typeof formDataDto.getResponse("checking", 0).capacity === "number")
		{
			await this.prisma.chat.update({
				where: { id: room.id },
				data: {
					next_owner: room.nbUsers === 1 ? req.user.name : room.next_owner,
					nbUsers: room.nbUsers + 1,
				},
			});
			return (res.json(formDataDto.getResponse(room.pfp, room.capacity)));
		}
		try
		{
			const hashPass = bcrypt.hashSync(formData.password, 10);
			const number = formData.capacity.toString();
			const response = formDataDto.getResponse(formData.pfp, parseInt(number));
			if (!isJoin && typeof response.capacity === "number")
			{
				await this.prisma.chat.create({
					data: {
						owner: req.user.name,
						admin: [],
						needPass: formData.password.length ? true : false,
						password: formData.password.length ? hashPass : "",
						pfp: formData.pfp,
						capacity: parseInt(number),
						nbUsers: 1,
						roomName: formData.name,
						description: formData.description,
						banned: [],
						muted: [],
						user: {
							connect: { id: user.id },
						}
					}
				});
			}
			return (res.json(response));
		}
		catch (error) {
			console.log("Error in the creation of group:", error);
		}
	}

	@Get('all-groups')
	@UseGuards(JwtAuthenticationGuard)
	async getAllGroups(@Req() req: any) {
	  const allGroups = await this.prisma.chat.findMany();
	  const filteredGroups = allGroups.filter((group) => !group.banned.includes(req.user.name));
	  const groups = filteredGroups.map((group) => ({
		pfp: group.pfp,
		name: group.roomName,
		description: group.description,
		nbUser: group.nbUsers,
		capacity: group.capacity,
		needPass: group.needPass
	  }));
	  return (groups);
	}

	@Delete('leaving-group')
	@UseGuards(JwtAuthenticationGuard)
	async leavingGroup(@Query('roomName') roomName: string, @Req() req: any){
		const room = await this.prisma.chat.findFirst({
			where: { roomName: roomName },
			include: { user: true }
		});
		if (room)
		{
			await this.userService.disconnectUserFromChat(req.user.id, roomName);
			await this.userService.removeFromChatList(req.user, roomName);
			if (room.nbUsers > 1)
			{
				return (await this.prisma.chat.update({
					where: { id: room.id },
					data: {
						nbUsers: room.nbUsers - 1,
						owner: req.user.name === room.owner ? room.next_owner : room.owner,
						next_owner: req.user.name !== room.owner && req.user.name !== room.next_owner ?
						room.next_owner : room.admin.length ? room.admin[0] : room.nbUsers > 2 ? room.user[0].name : null
					},
				}));
			}
			else
			{
				return (
					await Promise.all([
						this.prisma.chat.delete({
							where: { id: room.id }
						}),
						this.prisma.message.deleteMany({
							where: { groupName: roomName }
						})
					]));
			}
		}
	}

	@Get('get-chats')
	@UseGuards(JwtAuthenticationGuard)
	async getChat(@Req() req: any) {
		const user = await this.prisma.user.findUnique({
			where: { id: req.user.id },
			include: { friends: true, chat: true },
		});
		if (!user || !user.chatList.length)
			return ([]);
		const userStatus = await this.prisma.user.findMany({
			where: { name: { in: user.friends.map((friend: any) => friend.friendname)}},
			select: { name: true, nameDisplay: true, pfp_url: true, state: true, invisibleMode: true }
		});
		const chatData = user.chatList.map((chatname) => {
			const chat = user.chat.find((item) => chatname === item.roomName);
			const friend = userStatus.find((user) => chatname === user.name);
			const isGroup = chat === undefined ? false : true;
			return ({
				pfp: isGroup ? chat.pfp : friend.pfp_url,
				name: isGroup ? chat.roomName : friend.name,
				nameDisplay: isGroup ? chat.roomName : friend.nameDisplay,
				status: isGroup ? undefined : friend.state,
				isGroup: isGroup,
				nbUser: isGroup ? chat.nbUsers : undefined,
				capacity: isGroup ? chat.capacity : undefined,
				isOwner: isGroup ? chat.owner === user.name ? true : false : undefined
			});
		});
		return (chatData);
	}

	@Post('set-chats')
	@UseGuards(JwtAuthenticationGuard)
	async setChats(@Body('chatList') chatList: {pfp: string, name: string, status?: string, isGroup: boolean, nbUser?: number, capacity?: number, owner: string}[], @Req() req: any) {
		const user = await this.prisma.user.findUnique({
			where: { id: req.user.id },
			include: { chat: true, friends: true},
		});
		if (!user.chatList.includes(chatList[0].name))
		{
			const allChat = await this.prisma.chat.findMany();
			const findedChat = allChat.find((item) => chatList[0].name === item.roomName);
			const existingUser = await this.userService.getUserByName(chatList[0].name);
			const updatedChat = [findedChat, ...user.chat];
			return (await this.prisma.user.update({
				where: { id: req.user.id },
				include: { chat: true },
				data: {
					chatList: [chatList[0].name, ...user.chatList],
					chat: existingUser ? req.user.chat : { set: updatedChat.map(chat => ({ id: chat.id })) }
				}
			}));
		}
	}

	@Patch('removeFriendFromChatList')
	@UseGuards(JwtAuthenticationGuard)
	async removeFriendFromChatList(@Body('roomName') roomName: string, @Req() req: any) {
		await this.userService.removeFromChatList(req.user, roomName);
	};

	@Get('get-users')
	@UseGuards(JwtAuthenticationGuard)
	async getUsers(@Query('roomName') roomName: string, @Req() req: any) {
		const room = await this.prisma.chat.findFirst({
			where: { roomName: roomName },
			include: { user: true },
		});
		const roomData = room.user.map((user) => ({
			pfp: user.pfp_url,
			name: user.name,
			nameDisplay: user.nameDisplay,
			role: room.owner === user.name ? "owner" : room.admin.includes(user.name) ? "admin" : "user",
			isPending: user.friendRequest.includes(req.user.name) ? true : false,
		}));
		return (roomData);
	}

	@Get('joinGroup')
	@UseGuards(JwtAuthenticationGuard)
	async joinGroup(@Query('groupName') groupName: string, @Req() req: any, @Query('password') password?: string){
		const room = await this.prisma.chat.findFirst({
			where: { roomName: groupName },
		});
		if (!room || (room && room.banned.includes(req.user.name)))
			return ("deleted");
		else if (room.nbUsers >= room.capacity)
			return ("full");
		else if (room && (password === undefined || bcrypt.compareSync(password, room.password)))
		{
			await this.prisma.chat.update({
				where: { id: room.id },
				data: {
					next_owner: room.nbUsers === 1 ? req.user.name : room.next_owner,
					nbUsers: room.nbUsers + 1,
				},
			});
			return ({pfp: room.pfp, capacity: room.capacity});
		}
		else
			return ("Bad Password");
	}

	@Get('get-groupInfo')
	@UseGuards(JwtAuthenticationGuard)
	async getGroupInfo(@Query('roomName') roomName: string, @Req() req: any) {
		const goodRoomName = await this.userService.getRoomName(req.user.name, roomName);
		const room = await this.prisma.chat.findFirst({
			where: { roomName: goodRoomName },
		});
		const messages = await this.prisma.message.findMany({
			where: { groupName: goodRoomName },
		});
		if (room)
			return ({name: roomName, nbUsers: room.nbUsers, capacity: room.capacity, description: room.description, msgs: messages, muted: room.muted});
		else if (messages)
			return ({name: roomName, nbUsers: 0, capacity: 0, description: "", msgs: messages, muted: []});
		else
			return ({name: roomName, nbUsers: 0, capacity: 0, description: "", msgs: [], muted: []});
	}

	@Post('editInfoGroup')
	@UseGuards(JwtAuthenticationGuard)
	async editInfoGroup(@Body('roomName') roomName: string, @Body('formData') formData: {name: string, password: string, capacity: number, description: string}) {
		const room = await this.prisma.chat.findFirst({ where: { roomName: roomName } });
		const existingRoom = await this.prisma.chat.findFirst({ where: { roomName: formData.name } });
		const existingUser = await this.userService.getUserByName(formData.name);
		if (existingRoom || existingUser)
			return ("Name Exist");
		if (room)
		{
			if (room.nbUsers > formData.capacity)
				return ("Too Low");
			const hashPass = bcrypt.hashSync(formData.password, 10);
			const number = formData.capacity.toString();
			return (await Promise.all([this.prisma.chat.update({
						where: { id: room.id },
						data: {
							roomName: formData.name.length ? formData.name : room.roomName,
							needPass: formData.password.length ? true : false,
							password: formData.password.length ? hashPass : "",
							capacity: parseInt(number),
							description: formData.description.length ? formData.description : room.description,
						},
					}),
					await this.prisma.message.updateMany({
						where: { groupName: roomName },
						data: {
							groupName: formData.name.length ? formData.name : room.roomName,
						},
					})])
			);
		}
	}

	@Get('getProfileStatus')
	@UseGuards(JwtAuthenticationGuard)
	async getProfileStatus(@Query('name') userName: string, @Query('isLocal') isLocal: boolean) {
		const user = await this.userService.getUserByName(userName);
		if (user)
			return ({privateMode: user.privateMode, invisibleMode: user.invisibleMode, rejectAuto: user.rejectAuto, state: (user.invisibleMode && !isLocal ? 'Offline' : user.state)});
		else
			return ({privateMode: true, invisibleMode: true, rejectAuto: true, state: 'Offline'});
	}

	@Get('getBlocked')
	@UseGuards(JwtAuthenticationGuard)
	async getBlocked(@Req() req: any) {
		const user = await this.prisma.user.findUnique({
			where: { id: req.user.id },
		});
		return (user.blocked);
	}

	@Patch('updateChatList')
	@UseGuards(JwtAuthenticationGuard)
	async updateChatList(@Body('list') list: string[], @Req() req: any)
	{
		return (this.prisma.user.update({
			where: { id: req.user.id },
			data: {
				chatList: list,
			},
		}));
	};

	@Patch('newBadgeSelected')
	@UseGuards(JwtAuthenticationGuard)
	async newBadgeSelected(@Body('index') index: number, @Req() req: any)
	{
		return (this.prisma.achievement.update({
			where: { id: req.user.id },
			data: { selected: index }
		}));
	};

	@Patch('updateStatus')
	@UseGuards(JwtAuthenticationGuard)
	async updateStatus(@Body('status') status: string, @Req() req: any)
	{
		return (this.prisma.user.update({
			where: { id: req.user.id },
			data: { state: status }
		}));
	}

	@Get('getProfileNotif')
	@UseGuards(JwtAuthenticationGuard)
	async getProfileNotif(@Req() req: any) {
		const user = await this.prisma.user.findUnique({
			where: { id: req.user.id },
		});
		return (user.profileNotif);
	}

	@Patch('setProfileNotif')
	@UseGuards(JwtAuthenticationGuard)
	async setProfileNotif(@Body('username') username: string, @Body('notif') notif: number) {
		return (this.prisma.user.update({
			where: { name: username },
			data: { profileNotif: notif }
		}));
	}

	@Get('getChatNotif')
	@UseGuards(JwtAuthenticationGuard)
	async getChatNotif(@Req() req: any){
		const user = await this.prisma.user.findUnique({
			where: { id: req.user.id },
		});
		const names = [];
		const notifs = [];
		user.chatNotif.forEach((json, index: number) => {
			names.push(Object.keys(json)[index])
			notifs.push(Object.values(json)[index]);
		});
		return ({names: names, notifs: notifs});
	}

	@Patch('setChatNotif')
	@UseGuards(JwtAuthenticationGuard)
	async setChatNotif(@Body('roomName') roomName: string, @Req() req: any){
		const room = await this.prisma.chat.findFirst({
			where: { roomName: roomName },
			include: { user: true },
		});
		if (room)
		{
			const offlineUsers = room.user.filter((user: any) => user.state === "Offline");
			if (offlineUsers.length)
			{
				for (const user of offlineUsers)
				{
					const userNotif = user.chatNotif.map((json: any) => Object.keys(json)[0] === roomName ? {[roomName]: (Number(Object.values(json)[0]) + 1)} : json);
					await this.prisma.user.update({
						where: { id: user.id },
						data: {
							chatNotif: userNotif,
						},
					});
				}
			}
			return ;
		}
		const user = await this.userService.getUserByName(roomName);
		if (!user || user.state !== "Offline")
			return ;
		const userNotif = user.chatNotif.map((json: any) => Object.keys(json)[0] === req.user.name ? {[req.user.name]: (Number(Object.values(json)[0]) + 1)} : json);
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				chatList : user.chatList.includes(req.user.name) ? user.chatList : [req.user.name, ...user.chatList],
				chatNotif: user.chatList.includes(req.user.name) ? userNotif : [{[req.user.name]: 1}, ...user.chatNotif],
			},
		});
	}

	@Patch('updateChatNotif')
	@UseGuards(JwtAuthenticationGuard)
	async updateChatNotif(@Req() req: any, @Body('names') names: string[], @Body('notifs') notifs: number[]) {
		const newNotifs = [];
		names.forEach((name, index) => {
			const json = {};
			json[name] = notifs[index];
			newNotifs.push(json);
		});
		return this.prisma.user.update({
			where: { id: req.user.id },
			data: { chatNotif: newNotifs },
		});
	}

	@Get('getGameInvite')
	@UseGuards(JwtAuthenticationGuard)
	async getGameInvite(@Req() req: any) {
		const invitations = await this.prisma.message.findMany({
			where: { type: "game", lastInvite: true },
		});
		const allPendingInvite = invitations.map((invite) => {
			const splitedMsg = invite.msg.split(" ");
			if (splitedMsg[1] === req.user.name && splitedMsg[4] === "Pending")
				return (splitedMsg[0]);
		});
		return (allPendingInvite);
	}

}
