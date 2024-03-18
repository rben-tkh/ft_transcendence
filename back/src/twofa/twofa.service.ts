import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { Response } from 'express';
import { toFileStream } from 'qrcode';
import { authenticator } from 'otplib';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwofaService {
  constructor (
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService
  ) {}
    
  public twofaCodeValid(twoFactorAuthenticationCode: string, user: User) {
    return authenticator.verify({
      token: twoFactorAuthenticationCode,
      secret: user.twoFactorSecret
    })
  }

  public async generateTwoFactorAuthenticationSecret(user: User) {
    try {
      const secret = authenticator.generateSecret(); 
      const otpauthUrl = authenticator.keyuri(user.email, this.configService.get('APP_NAME')!, secret);
      await this.prismaService.user.update({
         where: { id: user.id },
         data: { twoFactorSecret: secret },
       });
      return {
        secret,
        otpauthUrl
      }
    } catch {
      throw new BadRequestException();
    }
  }

  public async pipeQrCodeStream(stream: Response, otpauthUrl: string) {
    return toFileStream(stream, otpauthUrl);
  }
}