import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractDto {
  @ApiProperty({ example: '1,3,5-7', description: 'Comma-separated 1-based page numbers or ranges' })
  @IsString()
  pages: string;
}
