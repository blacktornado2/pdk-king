import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobStatus, JobType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async create(data: {
    type: JobType;
    inputFiles: string[];
    options?: Record<string, unknown>;
  }) {
    const expiryHours = this.config.get<number>('FILE_EXPIRY_HOURS', 1);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    return this.prisma.job.create({
      data: {
        type: data.type,
        inputFiles: data.inputFiles,
        options: (data.options ?? {}) as object,
        expiresAt,
      },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async markProcessing(id: string) {
    return this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.PROCESSING },
    });
  }

  async markDone(id: string, outputFile: string, meta?: Record<string, unknown>) {
    const existing = await this.findOne(id);
    const mergedOptions = {
      ...((existing.options as Record<string, unknown>) ?? {}),
      ...(meta ?? {}),
    };
    return this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.DONE, outputFile, options: mergedOptions as object },
    });
  }

  async markFailed(id: string, errorMsg: string) {
    return this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.FAILED, errorMsg },
    });
  }

  async deleteJob(id: string) {
    const job = await this.findOne(id);
    await this.prisma.job.delete({ where: { id } });
    return job;
  }

  async findExpired() {
    return this.prisma.job.findMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
