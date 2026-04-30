export type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

export type JobType =
  | 'MERGE'
  | 'SPLIT'
  | 'REORDER'
  | 'COMPRESS'
  | 'UNLOCK'
  | 'PROTECT'
  | 'ROTATE'
  | 'EXTRACT'
  | 'PDF_TO_IMAGE'
  | 'WATERMARK'
  | 'PAGE_NUMBERS'
  | 'METADATA';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  inputFiles: string[];
  outputFile: string | null;
  options: Record<string, unknown> | null;
  errorMsg: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}
