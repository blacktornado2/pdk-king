import {
  Controller,
  Post,
  UploadedFiles,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { multerConfig } from './multer.config';
import { SplitDto } from './dto/split.dto';
import { CompressDto } from './dto/compress.dto';
import { UnlockDto } from './dto/unlock.dto';
import { ProtectDto } from './dto/protect.dto';
import { RotateDto } from './dto/rotate.dto';
import { ExtractDto } from './dto/extract.dto';
import { PdfToImagesDto } from './dto/pdf-to-images.dto';
import { WatermarkDto } from './dto/watermark.dto';
import { PageNumbersDto } from './dto/page-numbers.dto';
import { MetadataDto } from './dto/metadata.dto';
import { EditPdfDto } from './dto/edit-pdf.dto';

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Post('merge')
  @ApiOperation({ summary: 'Merge multiple PDFs into one' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 20, multerConfig))
  merge(@UploadedFiles() files: Express.Multer.File[]) {
    return this.pdfService.merge(files);
  }

  @Post('split')
  @ApiOperation({ summary: 'Split a PDF by page range, every N pages, or extract pages' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  split(@UploadedFile() file: Express.Multer.File, @Body() dto: SplitDto) {
    return this.pdfService.split(file, dto);
  }

  @Post('compress')
  @ApiOperation({ summary: 'Compress a PDF with low/medium/high quality preset' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  compress(@UploadedFile() file: Express.Multer.File, @Body() dto: CompressDto) {
    return this.pdfService.compress(file, dto);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder pages in a PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  reorder(
    @UploadedFile() file: Express.Multer.File,
    @Body('order') order: string,
  ) {
    return this.pdfService.reorder(file, JSON.parse(order) as number[]);
  }

  @Post('unlock')
  @ApiOperation({ summary: 'Remove password protection from a PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  unlock(@UploadedFile() file: Express.Multer.File, @Body() dto: UnlockDto) {
    return this.pdfService.unlock(file, dto);
  }

  @Post('protect')
  @ApiOperation({ summary: 'Add password protection to a PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  protect(@UploadedFile() file: Express.Multer.File, @Body() dto: ProtectDto) {
    return this.pdfService.protect(file, dto);
  }

  @Post('rotate')
  @ApiOperation({ summary: 'Rotate pages in a PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  rotate(@UploadedFile() file: Express.Multer.File, @Body() dto: RotateDto) {
    return this.pdfService.rotate(file, dto);
  }

  @Post('extract')
  @ApiOperation({ summary: 'Extract selected pages into a new PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  extract(@UploadedFile() file: Express.Multer.File, @Body() dto: ExtractDto) {
    return this.pdfService.extract(file, dto);
  }

  @Post('to-images')
  @ApiOperation({ summary: 'Convert PDF pages to images (JPEG or PNG) bundled as ZIP' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  toImages(@UploadedFile() file: Express.Multer.File, @Body() dto: PdfToImagesDto) {
    return this.pdfService.pdfToImages(file, dto);
  }

  @Post('watermark')
  @ApiOperation({ summary: 'Stamp a diagonal text watermark on every page' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  watermark(@UploadedFile() file: Express.Multer.File, @Body() dto: WatermarkDto) {
    return this.pdfService.watermark(file, dto);
  }

  @Post('page-numbers')
  @ApiOperation({ summary: 'Add page numbers to every page' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  pageNumbers(@UploadedFile() file: Express.Multer.File, @Body() dto: PageNumbersDto) {
    return this.pdfService.addPageNumbers(file, dto);
  }

  @Post('edit')
  @ApiOperation({ summary: 'Replace text in a PDF (cover-and-redraw)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  editPdf(@UploadedFile() file: Express.Multer.File, @Body() dto: EditPdfDto) {
    return this.pdfService.editPdf(file, dto);
  }

  @Post('metadata')
  @ApiOperation({ summary: 'Edit PDF metadata fields' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  metadata(@UploadedFile() file: Express.Multer.File, @Body() dto: MetadataDto) {
    return this.pdfService.editMetadata(file, dto);
  }
}
