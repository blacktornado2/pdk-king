import { IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export type PageNumberPosition =
  | 'bottom-center' | 'bottom-left' | 'bottom-right'
  | 'top-center'    | 'top-left'    | 'top-right';

export class PageNumbersDto {
  @IsOptional()
  @IsIn(['bottom-center', 'bottom-left', 'bottom-right', 'top-center', 'top-left', 'top-right'])
  position?: PageNumberPosition;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  startFrom?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(8)
  @Max(36)
  fontSize?: number;
}
