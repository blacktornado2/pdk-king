import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';
import { JobsService } from '../../jobs/jobs.service';
import { StorageService } from '../../storage/storage.service';

@Processor('pdf')
export class ReorderProcessor extends WorkerHost {
  constructor(
    private jobsService: JobsService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'reorder') return;

    const { jobId, inputFile, order } = job.data as {
      jobId: string;
      inputFile: string;
      order: number[];
    };

    await this.jobsService.markProcessing(jobId);
    let succeeded = false;
    try {
      const bytes = this.storage.readFile(inputFile);
      const source = await PDFDocument.load(bytes);
      const total = source.getPageCount();

      const validOrder = order.filter((i) => i >= 0 && i < total);
      if (validOrder.length === 0) throw new Error('No valid page indices provided');

      const doc = await PDFDocument.create();
      const copied = await doc.copyPages(source, validOrder);
      copied.forEach((p) => doc.addPage(p));

      const outputBytes = await doc.save();
      const outputPath = this.storage.writeOutput(
        `reordered-${uuidv4()}.pdf`,
        Buffer.from(outputBytes),
      );

      await this.jobsService.markDone(jobId, outputPath);
      succeeded = true;
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    } finally {
      if (succeeded) this.storage.deleteFile(inputFile);
    }
  }
}
