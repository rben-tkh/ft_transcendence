// src/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { config } from 'dotenv';
config();


@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
