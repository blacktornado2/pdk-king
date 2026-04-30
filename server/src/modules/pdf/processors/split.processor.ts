import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PDFDocument } from 'pdf-lib';
import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JobsService } from '../../jobs/jobs.service';
import { StorageService } from '../../storage/storage.service';
import { SplitMode } from '../dto/split.dto';
import { parsePageIndices, parseRangeGroups, chunkByN } from '../utils/page-range';

@Processor('pdf')
export class SplitProcessor extends WorkerHost {
  constructor(
    private jobsService: JobsService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'split') return;

    const { jobId, inputFile, mode, pages, ranges, n } = job.data as {
      jobId: string;
      inputFile: string;
      mode: SplitMode;
      pages?: string;
      ranges?: string;
      n?: number;
    };

    await this.jobsService.markProcessing(jobId);

    try {
      const bytes = this.storage.readFile(inputFile);
      const sourceDoc = await PDFDocument.load(bytes);
      const total = sourceDoc.getPageCount();

      let outputPath: string;

      if (mode === SplitMode.EXTRACT) {
        const indices = parsePageIndices(pages!, total);
        outputPath = await this.buildSinglePdf(sourceDoc, indices, 'extract');
      } else {
        const groups =
          mode === SplitMode.EVERY_N
            ? chunkByN(total, n!)
            : parseRangeGroups(ranges!, total);

        outputPath = await this.buildZip(sourceDoc, groups);
      }

      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async buildSinglePdf(
    source: PDFDocument,
    indices: number[],
    prefix: string,
  ): Promise<string> {
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, indices);
    copied.forEach((p) => doc.addPage(p));
    const bytes = await doc.save();
    return this.storage.writeOutput(`${prefix}-${uuidv4()}.pdf`, Buffer.from(bytes));
  }

  private async buildZip(source: PDFDocument, groups: number[][]): Promise<string> {
    const zipFilename = `split-${uuidv4()}.zip`;
    const zipPath = this.storage.outputPath(zipFilename);

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver.default('zip', { zlib: { level: 6 } });

      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);

      const buildParts = async () => {
        for (let i = 0; i < groups.length; i++) {
          const doc = await PDFDocument.create();
          const copied = await doc.copyPages(source, groups[i]);
          copied.forEach((p) => doc.addPage(p));
          const pdfBytes = await doc.save();
          const startPage = (groups[i][0] ?? 0) + 1;
          const endPage = (groups[i][groups[i].length - 1] ?? 0) + 1;
          const name = `part-${i + 1}_pages-${startPage}-${endPage}.pdf`;
          archive.append(Buffer.from(pdfBytes), { name });
        }
        await archive.finalize();
      };

      buildParts().catch(reject);
    });

    return zipPath;
  }
}
