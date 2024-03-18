// src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserService } from './user/user.service';
import { AppController } from './app.controller';
import { UserController } from './user/user.controller';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthService } from './auth/auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UserModule } from './user/user.module';
import { PassportModule } from '@nestjs/passport';
import { AppService } from './app.service';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { TwofaService } from './twofa/twofa.service';
import { TwofaModule } from './twofa/twofa.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
	imports: [UserModule,
		PrismaModule,
		AuthModule,
		TwofaModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.register({
		secret: process.env.JWT_SECRET,
		signOptions: { expiresIn: '1d' },
		}),
		CloudinaryModule,
		GatewayModule],
	controllers: [AppController, UserController, AuthController],
	providers: [
		PrismaService, AppService, AuthService, UserService, TwofaService ,ConfigService, JwtStrategy],
})
export class AppModule {}

