import { Controller, Get, Post, Body, UseGuards, Res, HttpCode } from '@nestjs/common';
import { TwofaService } from './twofa.service';
import JwtAuthenticationGuard from '../jwt-guard/jwt-guard.guard';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { BadRequestException } from '@nestjs/common';
import * as qrcode from 'qrcode';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';


@Controller('twofa')
export class TwofaController {
  constructor(private readonly twofaService: TwofaService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly authService: AuthService) { }

    @Get('generate')
    @UseGuards(JwtAuthenticationGuard)
    async generateTwoFactorAuthentication(@GetUser() user: any, @Res() response: Response) {
      try {
        const { otpauthUrl } = await this.twofaService.generateTwoFactorAuthenticationSecret(user);
        const code = await qrcode.toDataURL(otpauthUrl);
        response.json({ code: code });
      } catch (error) {
        throw new BadRequestException('Error generating QR code');
      }
    }
  
    @Post('activate')
    @HttpCode(200)
    @UseGuards(JwtAuthenticationGuard)
    async turnOnTwoFactorAuthentication(@GetUser() user: any, @Body() body: { code: string }, @Res() res: Response) {
      try {
        const { code } = body;
        if (!user.twoFactorSecret) {
          throw new BadRequestException('2FA is not enabled for this user');
        }
        const isCodeValid = this.twofaService.twofaCodeValid(code, user);
        if (!isCodeValid) {
          throw new BadRequestException('Wrong authentication code');
        }
        await this.prisma.user.update({
          where: { id: user.id },
          data: { state: 'Online' },
        })
        res.status(200).json({ message: 'Connexion réussie' });
      } catch (error) {
        console.error(error);
        throw new BadRequestException('Error activating 2FA');
      }
    }
    
}
