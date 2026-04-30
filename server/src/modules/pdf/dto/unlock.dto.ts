import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UnlockDto {
  @ApiProperty({ example: 'mypassword' })
  @IsString()
  password: string;
}
