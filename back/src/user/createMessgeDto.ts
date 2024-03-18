import { IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  readonly type: string;

  @IsString()
  readonly time: string;

  @IsString()
  readonly username: string;

  @IsString()
  readonly msg: string;

  @IsString()
  readonly groupName: string;
}
