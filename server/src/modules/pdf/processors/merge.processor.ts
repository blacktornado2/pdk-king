import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { JobsService } from '../../jobs/jobs.service';
import { StorageService } from '../../storage/storage.service';

@Processor('pdf')
export class MergeProcessor extends WorkerHost {
  constructor(
    private jobsService: JobsService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'merge') return;

    const { jobId, inputFiles } = job.data as {
      jobId: string;
      inputFiles: string[];
    };

    await this.jobsService.markProcessing(jobId);

    try {
      const merged = await PDFDocument.create();

      for (const filePath of inputFiles) {
        const bytes = this.storage.readFile(filePath);
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }

      const outputBytes = await merged.save();
      const outputFilename = `merged-${uuidv4()}.pdf`;
      const outputPath = this.storage.writeOutput(
        outputFilename,
        Buffer.from(outputBytes),
      );

      await this.jobsService.markDone(jobId, outputPath);

      for (const f of inputFiles) {
        this.storage.deleteFile(f);
      }
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }
}
