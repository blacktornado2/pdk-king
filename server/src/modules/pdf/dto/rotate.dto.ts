import { IsIn, IsNumber, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RotateDto {
  @ApiProperty({ example: 'all', description: '"all" or comma-separated 1-based page numbers e.g. "1,3,5-7"' })
  @IsString()
  pages: string;

  @ApiProperty({ enum: [90, 180, 270], example: 90 })
  @Transform(({ value }) => Number(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsIn([90, 180, 270])
  degrees: 90 | 180 | 270;
}
