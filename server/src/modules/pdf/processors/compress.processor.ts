import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { JobsService } from '../../jobs/jobs.service';
import { StorageService } from '../../storage/storage.service';
import { CompressionQuality } from '../dto/compress.dto';

const execFileAsync = promisify(execFile);

const GS_SETTINGS: Record<CompressionQuality, string> = {
  [CompressionQuality.LOW]: '/screen',
  [CompressionQuality.MEDIUM]: '/ebook',
  [CompressionQuality.HIGH]: '/printer',
};

@Processor('pdf')
export class CompressProcessor extends WorkerHost {
  constructor(
    private jobsService: JobsService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'compress') return;

    const { jobId, inputFile, quality } = job.data as {
      jobId: string;
      inputFile: string;
      quality: CompressionQuality;
    };

    await this.jobsService.markProcessing(jobId);

    const outputFilename = `compressed-${uuidv4()}.pdf`;
    const outputPath = this.storage.outputPath(outputFilename);
    let succeeded = false;

    try {
      const originalSize = fs.statSync(inputFile).size;

      const pdfsetting = GS_SETTINGS[quality] ?? GS_SETTINGS[CompressionQuality.MEDIUM];

      await execFileAsync('gs', [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        `-dPDFSETTINGS=${pdfsetting}`,
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        `-sOutputFile=${outputPath}`,
        inputFile,
      ]);

      const compressedSize = fs.statSync(outputPath).size;
      const savedBytes = originalSize - compressedSize;
      const savedPercent = originalSize > 0
        ? Math.min(100, Math.max(0, Math.round((savedBytes / originalSize) * 100)))
        : 0;

      await this.jobsService.markDone(jobId, outputPath, {
        originalSize,
        compressedSize,
        savedBytes,
        savedPercent,
      });

      succeeded = true;
    } catch (err) {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      await this.jobsService.markFailed(jobId, (err as Error).message);
    } finally {
      if (succeeded) this.storage.deleteFile(inputFile);
    }
  }
}
