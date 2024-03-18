import { Module } from '@nestjs/common';
import { TwofaService } from './twofa.service';
import { TwofaController } from './twofa.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Module({
  controllers: [TwofaController],
  providers: [TwofaService, PrismaService, ConfigService, JwtService, AuthService, UserService],
})
export class TwofaModule {}
