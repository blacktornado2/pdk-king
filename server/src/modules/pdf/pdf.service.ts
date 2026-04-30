import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobType } from '@prisma/client';
import { JobsService } from '../jobs/jobs.service';
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
import { SplitMode } from './dto/split.dto';

@Injectable()
export class PdfService {
  constructor(
    @InjectQueue('pdf') private pdfQueue: Queue,
    private jobsService: JobsService,
  ) {}

  async compress(file: Express.Multer.File, dto: CompressDto) {
    const job = await this.jobsService.create({
      type: JobType.COMPRESS,
      inputFiles: [file.path],
      options: { quality: dto.quality, originalSize: file.size },
    });

    await this.pdfQueue.add('compress', {
      jobId: job.id,
      inputFile: file.path,
      quality: dto.quality,
    });

    return { jobId: job.id };
  }

  async reorder(file: Express.Multer.File, order: number[]) {
    const job = await this.jobsService.create({
      type: JobType.REORDER,
      inputFiles: [file.path],
      options: { order } as unknown as Record<string, unknown>,
    });

    await this.pdfQueue.add('reorder', {
      jobId: job.id,
      inputFile: file.path,
      order,
    });

    return { jobId: job.id };
  }

  async merge(files: Express.Multer.File[]) {
    const inputFiles = files.map((f) => f.path);

    const job = await this.jobsService.create({
      type: JobType.MERGE,
      inputFiles,
    });

    await this.pdfQueue.add('merge', { jobId: job.id, inputFiles });

    return { jobId: job.id };
  }

  async split(file: Express.Multer.File, dto: SplitDto) {
    const job = await this.jobsService.create({
      type: JobType.SPLIT,
      inputFiles: [file.path],
      options: dto as unknown as Record<string, unknown>,
    });

    await this.pdfQueue.add('split', {
      jobId: job.id,
      inputFile: file.path,
      ...dto,
    });

    return { jobId: job.id };
  }

  async unlock(file: Express.Multer.File, dto: UnlockDto) {
    const job = await this.jobsService.create({
      type: JobType.UNLOCK,
      inputFiles: [file.path],
    });

    await this.pdfQueue.add('unlock', {
      jobId: job.id,
      inputFile: file.path,
      password: dto.password,
    });

    return { jobId: job.id };
  }

  async rotate(file: Express.Multer.File, dto: RotateDto) {
    const job = await this.jobsService.create({
      type: JobType.ROTATE,
      inputFiles: [file.path],
      options: { pages: dto.pages, degrees: dto.degrees },
    });

    await this.pdfQueue.add('rotate', {
      jobId: job.id,
      inputFile: file.path,
      pages: dto.pages,
      degrees: dto.degrees,
    });

    return { jobId: job.id };
  }

  async extract(file: Express.Multer.File, dto: ExtractDto) {
    const job = await this.jobsService.create({
      type: JobType.EXTRACT,
      inputFiles: [file.path],
      options: { pages: dto.pages },
    });

    await this.pdfQueue.add('split', {
      jobId: job.id,
      inputFile: file.path,
      mode: SplitMode.EXTRACT,
      pages: dto.pages,
    });

    return { jobId: job.id };
  }

  async pdfToImages(file: Express.Multer.File, dto: PdfToImagesDto) {
    const job = await this.jobsService.create({
      type: JobType.PDF_TO_IMAGE,
      inputFiles: [file.path],
      options: { format: dto.format ?? 'jpeg' },
    });

    await this.pdfQueue.add('pdf-to-images', {
      jobId: job.id,
      inputFile: file.path,
      format: dto.format ?? 'jpeg',
    });

    return { jobId: job.id };
  }

  async watermark(file: Express.Multer.File, dto: WatermarkDto) {
    const job = await this.jobsService.create({
      type: JobType.WATERMARK,
      inputFiles: [file.path],
      options: { text: dto.text, opacity: dto.opacity ?? 0.3, fontSize: dto.fontSize ?? 48 },
    });

    await this.pdfQueue.add('watermark', {
      jobId: job.id,
      inputFile: file.path,
      text: dto.text,
      opacity: dto.opacity ?? 0.3,
      fontSize: dto.fontSize ?? 48,
    });

    return { jobId: job.id };
  }

  async editPdf(file: Express.Multer.File, dto: EditPdfDto) {
    const edits = JSON.parse(dto.edits) as unknown[];
    const job = await this.jobsService.create({
      type: JobType.EDIT,
      inputFiles: [file.path],
      options: { editCount: edits.length },
    });

    await this.pdfQueue.add('edit-pdf', {
      jobId: job.id,
      inputFile: file.path,
      edits,
    });

    return { jobId: job.id };
  }

  async addPageNumbers(file: Express.Multer.File, dto: PageNumbersDto) {
    const job = await this.jobsService.create({
      type: JobType.PAGE_NUMBERS,
      inputFiles: [file.path],
      options: { position: dto.position ?? 'bottom-center', startFrom: dto.startFrom ?? 1, fontSize: dto.fontSize ?? 12 },
    });

    await this.pdfQueue.add('page-numbers', {
      jobId: job.id,
      inputFile: file.path,
      position: dto.position ?? 'bottom-center',
      startFrom: dto.startFrom ?? 1,
      fontSize: dto.fontSize ?? 12,
    });

    return { jobId: job.id };
  }

  async editMetadata(file: Express.Multer.File, dto: MetadataDto) {
    const job = await this.jobsService.create({
      type: JobType.METADATA,
      inputFiles: [file.path],
      options: { ...dto },
    });

    await this.pdfQueue.add('metadata', {
      jobId: job.id,
      inputFile: file.path,
      ...dto,
    });

    return { jobId: job.id };
  }

  async protect(file: Express.Multer.File, dto: ProtectDto) {
    const job = await this.jobsService.create({
      type: JobType.PROTECT,
      inputFiles: [file.path],
    });

    await this.pdfQueue.add('protect', {
      jobId: job.id,
      inputFile: file.path,
      password: dto.password,
    });

    return { jobId: job.id };
  }
}
