import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { PdfProcessor } from './processors/pdf.processor';
import { JobsModule } from '../jobs/jobs.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'pdf' }),
    JobsModule,
    StorageModule,
  ],
  controllers: [PdfController],
  providers: [PdfService, PdfProcessor],
})
export class PdfModule {}
