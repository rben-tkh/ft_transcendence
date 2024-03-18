import { Body, Controller, Post, Req, UseGuards, Patch } from '@nestjs/common';
import JwtAuthenticationGuard from "../jwt-guard/jwt-guard.guard";
import { PrismaService } from '../prisma/prisma.service';

@Controller('chat')
export class ChatController {
	constructor(private readonly prisma: PrismaService) {}

	@Patch('ban')
	@UseGuards(JwtAuthenticationGuard)
	async ban(@Body('userName') userName: string, @Body('roomName') roomName: string) {
		const chatRoom = await this.prisma.chat.findFirst({
			where: { roomName: roomName }
		});
		if (chatRoom)
		{
			const currentBanned = chatRoom.banned;
			return (await this.prisma.chat.update({
				where: { id: chatRoom.id },
				data: { banned: [...currentBanned, userName] }
			}))
		}
	}

	@Patch('muteState')
	@UseGuards(JwtAuthenticationGuard)
	async muteState(@Body('roomName') roomName: string, @Body('userName') userName: string)
	{
		const room = await this.prisma.chat.findFirst({
			where: { roomName: roomName },
		});
		const updatedMuted = room.muted.includes(userName) ? room.muted.filter((name) => name !== userName) : [...room.muted, userName];
		return (await this.prisma.chat.update({
			where: { id: room.id },
			data: { muted: updatedMuted },
		}));
	};

	@Patch('roleState')
	@UseGuards(JwtAuthenticationGuard)
	async roleState(@Body('roomName') roomName: string, @Body('userName') userName: string)
	{
		const room = await this.prisma.chat.findFirst({
			where: { roomName: roomName },
		});
		const updatedAmin = room.admin.includes(userName) ? room.admin.filter((name) => name !== userName) : [...room.admin, userName];
		return (await this.prisma.chat.update({
			where: { id: room.id },
			data: { admin: updatedAmin },
		}));
	};

}
