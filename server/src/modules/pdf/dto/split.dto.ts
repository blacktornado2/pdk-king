import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SplitMode {
  EXTRACT = 'EXTRACT',   // pick specific pages → single PDF
  RANGES = 'RANGES',     // one PDF per range  → ZIP
  EVERY_N = 'EVERY_N',  // chunk every N pages → ZIP
}

export class SplitDto {
  @ApiProperty({ enum: SplitMode })
  @IsEnum(SplitMode)
  mode: SplitMode;

  @ApiProperty({ required: false, example: '1,3,5-7' })
  @IsOptional()
  @IsString()
  pages?: string;

  @ApiProperty({ required: false, example: '1-5,6-10' })
  @IsOptional()
  @IsString()
  ranges?: string;

  @ApiProperty({ required: false, example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  n?: number;
}
