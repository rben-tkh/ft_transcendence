//main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from 'dotenv';
import * as morgan from 'morgan';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

config();
dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.use(morgan.default('dev'));
	app.enableCors({ origin: process.env.URL_LOCAL_FRONT, credentials: true });
	app.use(cookieParser());
	app.use(passport.initialize());
	await app.listen(process.env.BACK_PORT || process.env.FRONT_PORT, '0.0.0.0');
}
bootstrap();
