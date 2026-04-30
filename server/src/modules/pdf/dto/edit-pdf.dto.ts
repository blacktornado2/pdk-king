import { IsString } from 'class-validator';

// edits is a JSON-encoded array of TextEdit objects (see EditPdf frontend page)
export class EditPdfDto {
  @IsString()
  edits: string;
}
