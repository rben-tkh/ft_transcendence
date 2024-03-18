import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { Response } from 'express';
import { User } from '@prisma/client'; // Importez le modèle User de Prisma
import { config } from 'dotenv';
import { TwofaService } from '../twofa/twofa.service';


config();

const axios = require('axios');
const client_id = process.env.UID_42;
const clientSecret = process.env.SECRET_42;
const redirect_url = process.env.REDIRECT_URL;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService, // Injectez le client Prisma
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

async connexion(userData: any, token: any, res: Response): Promise<User | null> {
    try {
        const user = await this.prisma.user.findUnique({ where: { id: userData.id } });
        if (!user) {
            await this.connexionUser(token, res);
        } else {
            if (user.twoFactorEnabled) {
                const newToken = await this.generateAndSetAccessToken(user);
                res.cookie("accessToken", newToken);
                res.redirect(`${process.env.URL_LOCAL_FRONT}/twofa`);
            } else {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: { state: 'Online' }
                });
                const newToken = await this.generateAndSetAccessToken(user);
                console.log("Connexion réussie");
                res.cookie("accessToken", newToken);
                res.redirect(process.env.URL_LOCAL + `/`);
            }
        }
        return user;
    } catch (error) {
        throw new BadRequestException(error);
    }
}

  async getAccessToken(code: string): Promise<any> {
    try {
        const response = await axios.post(process.env.TOKEN_42, {
            client_id: client_id,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: redirect_url,
        });
        const accessToken = response.data.access_token;
        return accessToken;
    }
    catch (error: any) {
        if (error.response && error.response.data) {
            console.error("Error from 42 API:", error.response.data);
        } else {
            console.error("Unexpected error:", error);
        }
        throw new HttpException('Failed to retrieve access token', HttpStatus.INTERNAL_SERVER_ERROR);
    }    
  }

async connexionUser(token: string, res: Response) {
    const userData = await this.getUserData(token);
    const user = await this.userService.createUser(userData);
    console.log("User : ", userData);
    const newToken = await this.generateAndSetAccessToken(user);
    res.cookie("accessToken", newToken);
    res.redirect(process.env.URL_LOCAL + `/`);
    res.status(200).json({ message: 'Connexion réussie' });
}

async getUserData(accessToken: string): Promise<any> {
    try {
        const userResponse = await axios.get(process.env.ME_42, {
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });
        return {
            id: userResponse.data.id,
            name: userResponse.data.login,
            email: userResponse.data.email,
            code: userResponse.data.code,
            pfp: userResponse.data.image.link, //Photo de profil par défaut
        };
    } catch {
        throw new HttpException('Failed to get user data', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

async generateAndSetAccessToken(user: User): Promise<string> {
    try {
        const jwtPayload = { username: user.name, sub: user.id };
        const newToken = this.jwtService.sign(jwtPayload);
        return newToken;
    } catch {
        throw new BadRequestException();
    }
}

}

