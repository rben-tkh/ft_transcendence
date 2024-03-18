// auth.controller.ts

import { Controller, Post, Body, Get, BadRequestException, Req, Res, Redirect, Patch, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';

import { Request } from 'express';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { TwofaService } from '../twofa/twofa.service';
import JwtAuthenticationGuard from "../jwt-guard/jwt-guard.guard";



@Controller('auth')
export class AuthController {
constructor(private readonly authService: AuthService,
	private prisma: PrismaService,
	private readonly jwtService: JwtService,
	private readonly UserService: UserService,
	private readonly twoFaService: TwofaService)
	{}

	@Get('authentification')
	@Redirect(process.env.INTRA_42)
		connec(){
		console.log('42 atteint');
	}

	@Get('login')
	async login(@Req() req: Request, @Res() response: Response) {
		const code = req.query.code;

		if (!code) {
			response.redirect(process.env.URL_LOCAL + '/');
			throw new BadRequestException('Code is missing');}

		try {
			const accessToken = await this.authService.getAccessToken(code); //ok
			const userData = await this.authService.getUserData(accessToken); 
			await this.authService.connexion(userData, accessToken, response);
		} catch (error){
			console.log("La raison du probleme : ",error);
			throw new BadRequestException(error);
		}
	}

	@Post('logout')
	@UseGuards(JwtAuthenticationGuard)
	async logout(@Req() request: Request){
		try {
			const authorizationHeader = request.headers.authorization;
			if (!authorizationHeader) {
				throw new BadRequestException('Authorization header is missing');
			}
			const accessToken = authorizationHeader.split(' ')[1];
			if (!accessToken) {
				throw new BadRequestException('Access token is missing');
			}
			const decodedJwtAccessToken: any = this.jwtService.decode(accessToken);
			const user = await this.UserService.getUserById(decodedJwtAccessToken.sub);
			if (!user) {
				throw new BadRequestException('User not found');
			}
			await this.prisma.user.update({
				where: { id: user.id },
				data: {
					state: 'Offline',
				},
			});
		}
		catch (err) {
			throw err;
		}
	}
}


