import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    console.log(this.datasource);
  }
  datasource(_datasource: any) {
    throw new Error('Method not implemented.');
  }
}