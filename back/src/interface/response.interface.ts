import { Response } from 'express';

interface CustomResponse extends Response {
  myCustomHeader?: string;
}

export default CustomResponse;