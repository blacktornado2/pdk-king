import { IsIn, IsOptional } from 'class-validator';

export class PdfToImagesDto {
  @IsOptional()
  @IsIn(['jpeg', 'png'])
  format?: 'jpeg' | 'png';
}
