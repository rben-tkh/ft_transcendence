import { Controller, Get, Post, Redirect, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user/user.service';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import JwtAuthenticationGuard from './jwt-guard/jwt-guard.guard';

@Controller()
export class AppController {
constructor(private readonly prisma: PrismaService,
	private readonly userService: UserService,
	private cloudinary: CloudinaryService ){}

	@Get()
	@Redirect('' + process.env.URL_LOCAL_FRONT + '/') //auth
	Bienvenue(){
	}

	@Get('authentification')
	@Redirect(process.env.REDIRECT_URL_2) //auth/authentification
	getConnected(){
		return(process.env.INTRA_42)
	}

	@Post('edit')
	@UseGuards(JwtAuthenticationGuard)
	@UseInterceptors(FileInterceptor('file'))
	async edit(@Body('name') name: string, @UploadedFile() file: Express.Multer.File) {
		try {
			const uploadResult = await this.cloudinary.uploadImage(file);
			const user = await this.userService.getUserByName(name);
			if (user) {
				const updatedUser = await this.prisma.user.update({
					where: { id: user.id },
					data: { pfp_url: uploadResult.secure_url },
				});
				return (updatedUser);
			}
			const group = await this.prisma.chat.findFirst({
				where: { roomName: name },
			});
			const updatedGroup = await this.prisma.chat.update({
				where: { id: group.id },
				data: { pfp: uploadResult.secure_url },
			});
			return (updatedGroup);
		} catch (err) {
			console.error('Error in /edit:', err);
		}
	}
}
