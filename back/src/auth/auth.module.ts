// auth.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { JwtStrategy } from '../strategy/jwt.strategy';
import { TwofaService } from '../twofa/twofa.service';

@Module({
  imports: [ 
  PassportModule.register({
    defaultStrategy: 'bearer'}), 
  JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '1d'},
  }),
  UserModule,
  PrismaModule,
  JwtModule
],
  providers: [AuthService, ConfigService, PrismaService, JwtStrategy, UserService, TwofaService],
  exports: [AuthService],
})
export class AuthModule {}