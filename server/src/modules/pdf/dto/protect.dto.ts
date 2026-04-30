import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProtectDto {
  @ApiProperty({ example: 'mypassword' })
  @IsString()
  @MinLength(1)
  password: string;
}
