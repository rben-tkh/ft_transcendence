import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User} from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';
import { authenticator } from 'otplib';

@Injectable()
export class UserService {
	constructor(private prisma: PrismaService) {}

	async createUser(user: any): Promise<User> {
		try {
			const userData = await this.prisma.user.create({
				data: {
					id: user.id,
					name: user.name,
					nameDisplay: user.name,
					email: user.email,
					state: 'Online',
					twoFactorSecret: authenticator.generateSecret(),
					pfp_url: user.pfp,
				}
			});
			await this.prisma.simpleGame.create({
				data: {
					id: user.id,
					rank: 'Rookie',
					rankRate: 0,
					win: 0,
					lose: 0
				}
			});
			await this.prisma.doubleGame.create({
				data: {
					id: user.id,
					rank: 'Rookie',
					rankRate: 0,
					win: 0,
					lose: 0
				}
			});
			await this.prisma.achievement.create({
				data: {
					id: user.id,
				}
			});
			return (userData);
		} catch (error) {
			console.error(error);
			throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	async findUserByEmail(email: string): Promise<User | null> {
		try {
		return await this.prisma.user.findUnique({
			where: { 
			email },
		});
		} catch {
		throw new BadRequestException();
		}
	}
	
	async getUserById(userId: number): Promise<any | null> {
		if (!userId) {
			throw new BadRequestException('User ID is missing');
		}
		try {
		const user = await this.prisma.user.findUnique({
			where: { id: parseInt(userId.toString()) },
			include: { friends: true },
		});
		return user;
		} catch (error) {
		console.error("User error 1: ", error);
		throw new BadRequestException();
		}
	}
	
	async getUserByName(username: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { name: username },
			include: { friends: true },
		});
	}
	
	/////////////////////////////////////////////two-factor authentication/////////////////////////////////////////////
	
	async turnOn(userId: number): Promise<User> {
		try {
		return this.prisma.user.update({
			where: { id: userId },
			data: { twoFactorEnabled: true },
		});
		} catch {
		throw new BadRequestException();
		}
	}

	async turnOff(userId: number): Promise<User> {
		try {
		return this.prisma.user.update({
			where: { id: userId },
			data: { twoFactorEnabled: false },
		});
		} catch {
		throw new BadRequestException();
		}
	}

	async setTwoFactorAuthenticationSecret(secret: string, userId: number) {
		try {
		return this.prisma.user.update({
			where: { id: userId },
			data: { twoFactorSecret: secret },
		});
		} catch {
		throw new BadRequestException();
		}
	}

	/////////////////////////////////GET all the db/////////////////////////////////////
	
	async getUserDate(date: any): Promise<User | null> {
		return this.prisma.user.findFirst({
			where: { date: date.date },
		});
	}

	/////////////////////////////////////////////Update the db/////////////////////////////////////////////

	async turnRejectedRequest(userId: number, state: boolean): Promise<User> {
		try {
			return this.prisma.user.update({
			where: { id: userId },
			data: { rejectAuto: state },
			});
		} catch {
			throw new BadRequestException();
		}
	}

	async blockUser(user: any, target: any): Promise<User>
	{
		try {
			return this.prisma.user.update({
			where: { id: user.id },
			data: { blocked: [...user.blocked, target.name]},
			});
		} catch(error) {
			console.log("error: ", error);
		}
	}

	async removeFriend(user: any, target: any)
	{
		try {
			await Promise.all([
				this.prisma.friends.delete({
					where: { id: user.friends.find((friend: any) => friend.friendname === target.name).id },
				}),
				this.prisma.friends.delete({
					where: { id: target.friends.find((friend: any) => friend.friendname === user.name).id },
				})
			]);
		} catch(error) {
			console.log("error: ", error);
		}
	}

	async sendDate(date: string) {
		const clock = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		const allChat = await this.prisma.chat.findMany({
			include: { user: true },
		});
		if (!allChat.length)
			return ;
		const allUserId = allChat.map((chat: any) => chat.user[0].id);
		try {
			const messageToCreate = allChat.map((chat: any, index: number) => ({
				type: "date",
				time: clock,
				userPfp: "",
				username: "",
				msg: date,
				groupName: chat.roomName,
				userId: allUserId[index],
			}));
			await this.prisma.message.createMany({
				data: messageToCreate,
			});
		}
		catch (error) {
			console.log("error: ", error);
		}
	}

	async removeFromChatList(user: any, roomName: string) {
		try {
			const chatIndex = user.chatList.findIndex((name: string) => name === roomName);
			await this.prisma.user.update({
				where: { id: user.id },
				data: {
					chatList: user.chatList.filter((name: string) => name !== roomName),
				},
			});
		} catch (error) {
			console.log("error: ", error);
		}
	}

	async disconnectUserFromChat(userId: any, roomName: string) {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
				include: { chat: true },
			});
			const chatRoom = await this.prisma.chat.findFirst({
				where: { roomName },
			});
			await this.prisma.chat.update({
				where: { id: chatRoom.id },
				data: { user: { disconnect: { id: user.id } } },
			});
		} catch (error) {
			console.log("error: ", error);
		}
	}

	async getRoomName(name1: string, name2: string): Promise<string> {
		const spaces = ' '.repeat(7);
		if (await this.prisma.chat.findFirst({ where: { roomName: name2 } }))
			return (name2);
		else if (await this.prisma.message.findFirst({ where: { groupName: `${name1}${spaces}${name2}` } }))
			return (`${name1}${spaces}${name2}`);
		return (`${name2}${spaces}${name1}`);
	};

	async sendGroupMessageToDb(messageData: any, username: string, roomName: any) {
		const user = await this.getUserByName(username);
		return (await this.prisma.message.create({
			data: {
				type: messageData.type, 
				time: messageData.time,
				userPfp: user.pfp_url,
				username: user.name,
				msg: messageData.msg,
				groupName: roomName,
				user: {
					connect: { id: user.id },
				},
			},
		}));
	}

	async refreshOfflineStatus(name: string)
	{
		const user = await this.prisma.user.findUnique({
			where: { name: name },
		});
		if (!user)
			return ;
		return (this.prisma.user.update({
			where: { id: user.id },
			data: { state: "Offline" }
		}));
	}

	async updateGameInvite(name: string, state: string) {
		const user = await this.getUserByName(name);
		const invitation = await this.prisma.message.findFirst({
			where: { userId: user.id, type: "game", lastInvite: true },
		});
		if (invitation) {
			const splitedMsg = invitation.msg.split(' ');
			await this.prisma.message.update({
				where: { id: invitation.id },
				data: { msg: `${splitedMsg[0]} ${splitedMsg[1]} ${splitedMsg[2]} ${splitedMsg[3]} ${state}` }
			});
		}
	}
}
