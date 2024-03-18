import { Response } from 'express';
declare module 'express' {
    interface Request {
      user: any; // Remplacez 'any' par le type de votre utilisateur si possible
    }
  }
declare module 'express' {
    interface Request {
      query: { [key: string]: string };
    }
  }
declare module 'express' {
    interface Response {
      user: any;
    }
  }
  