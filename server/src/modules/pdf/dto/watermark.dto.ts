import { IsString, MinLength, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class WatermarkDto {
  @IsString()
  @MinLength(1)
  text: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.05)
  @Max(1)
  opacity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(12)
  @Max(120)
  fontSize?: number;
}
