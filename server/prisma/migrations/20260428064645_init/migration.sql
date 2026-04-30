-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('MERGE', 'SPLIT', 'REORDER', 'COMPRESS', 'UNLOCK', 'PROTECT', 'ROTATE', 'EXTRACT', 'PDF_TO_IMAGE', 'WATERMARK', 'PAGE_NUMBERS', 'METADATA');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "inputFiles" TEXT[],
    "outputFile" TEXT,
    "options" JSONB,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);
