import {
  Controller,
  Get,
  Param,
  Delete,
  Res,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import * as path from 'path';
import { JobsService } from './jobs.service';
import { StorageService } from '../storage/storage.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private jobs: JobsService,
    private storage: StorageService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Poll job status' })
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download job output file' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const job = await this.jobs.findOne(id);

    if (!job.outputFile) {
      throw new NotFoundException('Output file not ready');
    }
    if (!this.storage.fileExists(job.outputFile)) {
      throw new NotFoundException('Output file has expired or been deleted');
    }

    const resolved = path.resolve(job.outputFile);
    const outputDir = path.resolve(this.storage.outputPath(''));
    if (!resolved.startsWith(outputDir + path.sep) && resolved !== outputDir) {
      throw new ForbiddenException('Access denied');
    }

    res.download(resolved);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/cleanup a job' })
  async remove(@Param('id') id: string) {
    const job = await this.jobs.deleteJob(id);

    if (job.outputFile) {
      this.storage.deleteFile(job.outputFile);
    }
    for (const f of job.inputFiles) {
      this.storage.deleteFile(f);
    }

    return { deleted: true };
  }
}
