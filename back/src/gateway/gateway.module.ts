import { Module } from '@nestjs/common';
import { GameServer } from './game';
import { ChatServer } from './chat';
import { UserService } from '../user/user.service';
import { GameController } from './game.controller';
import { ChatController } from './chat.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
	imports: [],
	controllers: [GameController, ChatController],
	providers: [GameServer, ChatServer, PrismaService, UserService],
	exports: [GameServer, ChatServer],
})

export class GatewayModule {}
