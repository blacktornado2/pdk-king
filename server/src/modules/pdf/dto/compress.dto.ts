import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CompressionQuality {
  LOW = 'low',       // /screen  — 72 dpi, max compression
  MEDIUM = 'medium', // /ebook   — 150 dpi, balanced
  HIGH = 'high',     // /printer — 300 dpi, light compression
}

export class CompressDto {
  @ApiProperty({ enum: CompressionQuality, default: CompressionQuality.MEDIUM })
  @IsEnum(CompressionQuality)
  quality: CompressionQuality;
}
