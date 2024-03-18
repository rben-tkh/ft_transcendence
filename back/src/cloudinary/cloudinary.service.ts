import { Injectable, BadRequestException } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import toStream = require('buffer-to-stream');
import * as express from 'express';
import * as multer from 'multer';
import * as stream from 'stream';


@Injectable()
export class CloudinaryService {
  async uploadImage(fileName: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      return new Promise((resolve, reject) => {
        v2.config({
          cloud_name: process.env.CLOUD_NAME,
          api_key: process.env.API_KEY,
          api_secret: process.env.API_SECRET,
        });
        if (!fileName.mimetype.startsWith("image"))
          throw new BadRequestException("Bad image type")
        const upload = v2.uploader.upload_stream((error, result) => {
          if (error){
            return reject(error);
          } 
          else if (result) {
            resolve(result);
          }
        });
        toStream(fileName.buffer).pipe(upload);
      });
    } catch (error : any) {
      throw new error;
    }
  }
}