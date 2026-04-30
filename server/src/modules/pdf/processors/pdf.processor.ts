import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PDFDocument, PDFFont, rgb, StandardFonts } from 'pdf-lib';
import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { JobsService } from '../../jobs/jobs.service';
import { StorageService } from '../../storage/storage.service';
import { SplitMode } from '../dto/split.dto';
import { CompressionQuality } from '../dto/compress.dto';
import { parsePageIndices, parseRangeGroups, chunkByN } from '../utils/page-range';
import { degrees } from 'pdf-lib';

const execFileAsync = promisify(execFile);

function sanitizeMetadataString(value: string): string {
  // Strip C0/C1 control characters and limit length to prevent malformed PDF XMP streams.
  return value.replace(/[\x00-\x1F\x7F-\x9F]/g, '').slice(0, 1024);
}

function sanitizePassword(password: string): string {
  // qpdf treats arguments starting with '--' as flags; strip null bytes and
  // enforce a length cap so the value can never be mistaken for an option.
  if (typeof password !== 'string') throw new Error('Invalid password');
  const cleaned = password.replace(/\x00/g, '').slice(0, 512);
  if (cleaned.startsWith('--')) throw new Error('Password must not start with --');
  return cleaned;
}

function mapToStandardFont(fontName: string): StandardFonts {
  const n = (fontName ?? '').toLowerCase();
  if (n.includes('bold') && (n.includes('italic') || n.includes('oblique'))) return StandardFonts.HelveticaBoldOblique;
  if (n.includes('bold'))                                                     return StandardFonts.HelveticaBold;
  if (n.includes('italic') || n.includes('oblique'))                          return StandardFonts.HelveticaOblique;
  if (n.includes('times') || n.includes('roman'))                             return StandardFonts.TimesRoman;
  if (n.includes('courier') || n.includes('mono'))                            return StandardFonts.Courier;
  return StandardFonts.Helvetica;
}

const GS_SETTINGS: Record<CompressionQuality, string> = {
  [CompressionQuality.LOW]: '/screen',
  [CompressionQuality.MEDIUM]: '/ebook',
  [CompressionQuality.HIGH]: '/printer',
};

@Processor('pdf')
export class PdfProcessor extends WorkerHost {
  constructor(
    private jobsService: JobsService,
    private storage: StorageService,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'merge':    return this.handleMerge(job);
      case 'split':    return this.handleSplit(job);
      case 'reorder':  return this.handleReorder(job);
      case 'compress': return this.handleCompress(job);
      case 'unlock':   return this.handleUnlock(job);
      case 'protect':  return this.handleProtect(job);
      case 'rotate':      return this.handleRotate(job);
      case 'pdf-to-images': return this.handlePdfToImages(job);
      case 'watermark':      return this.handleWatermark(job);
      case 'page-numbers':   return this.handlePageNumbers(job);
      case 'metadata':       return this.handleMetadata(job);
      case 'edit-pdf':       return this.handleEditPdf(job);
    }
  }

  private async handleMerge(job: Job) {
    const { jobId, inputFiles } = job.data as { jobId: string; inputFiles: string[] };
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
      const outputPath = this.storage.writeOutput(`merged-${uuidv4()}.pdf`, Buffer.from(outputBytes));
      await this.jobsService.markDone(jobId, outputPath);
      for (const f of inputFiles) this.storage.deleteFile(f);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async handleSplit(job: Job) {
    const { jobId, inputFile, mode, pages, ranges, n } = job.data as {
      jobId: string; inputFile: string; mode: SplitMode;
      pages?: string; ranges?: string; n?: number;
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
        const groups = mode === SplitMode.EVERY_N
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

  private async handleReorder(job: Job) {
    const { jobId, inputFile, order } = job.data as { jobId: string; inputFile: string; order: number[] };
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
      const outputPath = this.storage.writeOutput(`reordered-${uuidv4()}.pdf`, Buffer.from(outputBytes));
      await this.jobsService.markDone(jobId, outputPath);
      succeeded = true;
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    } finally {
      if (succeeded) this.storage.deleteFile(inputFile);
    }
  }

  private async handleCompress(job: Job) {
    const { jobId, inputFile, quality } = job.data as { jobId: string; inputFile: string; quality: CompressionQuality };
    await this.jobsService.markProcessing(jobId);
    const outputPath = this.storage.outputPath(`compressed-${uuidv4()}.pdf`);
    try {
      const originalSize = fs.statSync(inputFile).size;
      const pdfsetting = GS_SETTINGS[quality] ?? GS_SETTINGS[CompressionQuality.MEDIUM];

      await execFileAsync('gs', [
        '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
        `-dPDFSETTINGS=${pdfsetting}`, '-dNOPAUSE', '-dQUIET', '-dBATCH',
        `-sOutputFile=${outputPath}`, inputFile,
      ]);

      const compressedSize = fs.statSync(outputPath).size;
      const savedBytes = originalSize - compressedSize;
      const savedPercent = originalSize > 0
        ? Math.min(100, Math.max(0, Math.round((savedBytes / originalSize) * 100)))
        : 0;
      await this.jobsService.markDone(jobId, outputPath, {
        originalSize, compressedSize, savedBytes, savedPercent,
      });
      this.storage.deleteFile(inputFile);
    } catch (err) {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async handleUnlock(job: Job) {
    const { jobId, inputFile, password } = job.data as { jobId: string; inputFile: string; password: string };
    await this.jobsService.markProcessing(jobId);
    const outputPath = this.storage.outputPath(`unlocked-${uuidv4()}.pdf`);
    try {
      const safePassword = sanitizePassword(password);
      await execFileAsync('qpdf', [
        `--password=${safePassword}`,
        '--decrypt',
        inputFile,
        outputPath,
      ]);
      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      const msg = (err as Error).message;
      const friendly = msg.includes('invalid password')
        ? 'Incorrect password. Please try again.'
        : msg;
      await this.jobsService.markFailed(jobId, friendly);
    }
  }

  private async handleProtect(job: Job) {
    const { jobId, inputFile, password } = job.data as { jobId: string; inputFile: string; password: string };
    await this.jobsService.markProcessing(jobId);
    const outputPath = this.storage.outputPath(`protected-${uuidv4()}.pdf`);
    try {
      const safePassword = sanitizePassword(password);
      await execFileAsync('qpdf', [
        '--encrypt', safePassword, safePassword, '256', '--',
        inputFile,
        outputPath,
      ]);
      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async handleRotate(job: Job) {
    const { jobId, inputFile, pages, degrees: deg } = job.data as {
      jobId: string; inputFile: string; pages: string; degrees: 90 | 180 | 270;
    };
    await this.jobsService.markProcessing(jobId);
    try {
      const bytes = this.storage.readFile(inputFile);
      const doc = await PDFDocument.load(bytes);
      const total = doc.getPageCount();

      const indices = pages === 'all'
        ? Array.from({ length: total }, (_, i) => i)
        : parsePageIndices(pages, total);

      for (const i of indices) {
        const page = doc.getPage(i);
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + deg) % 360));
      }

      const outputBytes = await doc.save();
      const outputPath = this.storage.writeOutput(`rotated-${uuidv4()}.pdf`, Buffer.from(outputBytes));
      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async handlePdfToImages(job: Job) {
    const { jobId, inputFile, format = 'jpeg' } = job.data as {
      jobId: string; inputFile: string; format: 'jpeg' | 'png';
    };
    await this.jobsService.markProcessing(jobId);

    const tmpDir = path.join(os.tmpdir(), `pdf-imgs-${uuidv4()}`);
    fs.mkdirSync(tmpDir);

    try {
      const device = format === 'png' ? 'png16m' : 'jpeg';
      const ext = format === 'png' ? 'png' : 'jpg';
      const outputPattern = path.join(tmpDir, `page-%04d.${ext}`);

      await execFileAsync('gs', [
        '-dNOPAUSE', '-dBATCH',
        `-sDEVICE=${device}`,
        '-r150',
        ...(format === 'jpeg' ? ['-dJPEGQ=85'] : []),
        `-sOutputFile=${outputPattern}`,
        inputFile,
      ]);

      const files = fs.readdirSync(tmpDir).filter((f) => f.endsWith(`.${ext}`)).sort();
      if (files.length === 0) throw new Error('No images were generated');

      const zipPath = this.storage.outputPath(`images-${uuidv4()}.zip`);
      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver.default('zip', { zlib: { level: 6 } });
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);
        for (const f of files) {
          archive.file(path.join(tmpDir, f), { name: f });
        }
        archive.finalize();
      });

      await this.jobsService.markDone(jobId, zipPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    } finally {
      if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
    }
  }

  private async handleWatermark(job: Job) {
    const { jobId, inputFile, text, opacity = 0.3, fontSize = 48 } = job.data as {
      jobId: string; inputFile: string; text: string; opacity?: number; fontSize?: number;
    };
    await this.jobsService.markProcessing(jobId);
    try {
      const bytes = this.storage.readFile(inputFile);
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);

      for (const page of doc.getPages()) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(45),
        });
      }

      const outputBytes = await doc.save();
      const outputPath = this.storage.writeOutput(`watermarked-${uuidv4()}.pdf`, Buffer.from(outputBytes));
      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async handlePageNumbers(job: Job) {
    const { jobId, inputFile, position = 'bottom-center', startFrom = 1, fontSize = 12 } = job.data as {
      jobId: string; inputFile: string;
      position?: string; startFrom?: number; fontSize?: number;
    };
    await this.jobsService.markProcessing(jobId);
    try {
      const bytes = this.storage.readFile(inputFile);
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const margin = 24;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const label = String(i + startFrom);
        const textWidth = font.widthOfTextAtSize(label, fontSize);

        let x: number;
        let y: number;

        if (position === 'bottom-center') { x = width / 2 - textWidth / 2; y = margin; }
        else if (position === 'bottom-left')   { x = margin; y = margin; }
        else if (position === 'bottom-right')  { x = width - textWidth - margin; y = margin; }
        else if (position === 'top-center')    { x = width / 2 - textWidth / 2; y = height - margin - fontSize; }
        else if (position === 'top-left')      { x = margin; y = height - margin - fontSize; }
        else                                   { x = width - textWidth - margin; y = height - margin - fontSize; }

        page.drawText(label, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      }

      const outputBytes = await doc.save();
      const outputPath = this.storage.writeOutput(`numbered-${uuidv4()}.pdf`, Buffer.from(outputBytes));
      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async handleMetadata(job: Job) {
    const { jobId, inputFile, title, author, subject, keywords } = job.data as {
      jobId: string; inputFile: string;
      title?: string; author?: string; subject?: string; keywords?: string;
    };
    await this.jobsService.markProcessing(jobId);
    try {
      const bytes = this.storage.readFile(inputFile);
      const doc = await PDFDocument.load(bytes);

      if (title    !== undefined) doc.setTitle(sanitizeMetadataString(title));
      if (author   !== undefined) doc.setAuthor(sanitizeMetadataString(author));
      if (subject  !== undefined) doc.setSubject(sanitizeMetadataString(subject));
      if (keywords !== undefined) doc.setKeywords([sanitizeMetadataString(keywords)]);

      const outputBytes = await doc.save();
      const outputPath = this.storage.writeOutput(`metadata-${uuidv4()}.pdf`, Buffer.from(outputBytes));
      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async handleEditPdf(job: Job) {
    const { jobId, inputFile, edits } = job.data as {
      jobId: string;
      inputFile: string;
      edits: Array<{
        pageIndex: number;
        x: number;
        y: number;
        width: number;
        fontSize: number;
        fontName: string;
        newText: string;
      }>;
    };
    await this.jobsService.markProcessing(jobId);
    try {
      const bytes = this.storage.readFile(inputFile);
      const doc = await PDFDocument.load(bytes);
      const fontCache = new Map<StandardFonts, PDFFont>();

      const getFont = async (fontName: string): Promise<PDFFont> => {
        const sf = mapToStandardFont(fontName);
        if (!fontCache.has(sf)) fontCache.set(sf, await doc.embedFont(sf));
        return fontCache.get(sf)!;
      };

      for (const edit of edits) {
        const page = doc.getPage(edit.pageIndex);
        const font = await getFont(edit.fontName);

        page.drawRectangle({
          x: edit.x - 1,
          y: edit.y - edit.fontSize * 0.25,
          width: edit.width + 4,
          height: edit.fontSize * 1.4,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });

        page.drawText(edit.newText, {
          x: edit.x,
          y: edit.y,
          size: edit.fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      }

      const outputBytes = await doc.save();
      const outputPath = this.storage.writeOutput(`edited-${uuidv4()}.pdf`, Buffer.from(outputBytes));
      await this.jobsService.markDone(jobId, outputPath);
      this.storage.deleteFile(inputFile);
    } catch (err) {
      await this.jobsService.markFailed(jobId, (err as Error).message);
    }
  }

  private async buildSinglePdf(source: PDFDocument, indices: number[], prefix: string): Promise<string> {
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, indices);
    copied.forEach((p) => doc.addPage(p));
    const bytes = await doc.save();
    return this.storage.writeOutput(`${prefix}-${uuidv4()}.pdf`, Buffer.from(bytes));
  }

  private async buildZip(source: PDFDocument, groups: number[][]): Promise<string> {
    const zipFilename = `split-${uuidv4()}.zip`;
    const zipPath = this.storage.outputPath(zipFilename);

    try {
      await new Promise<void>((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver.default('zip', { zlib: { level: 6 } });

        output.on('close', resolve);
        archive.on('error', (err) => {
          output.destroy();
          reject(err);
        });
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

        buildParts().catch((err) => {
          output.destroy();
          reject(err);
        });
      });
    } catch (err) {
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      throw err;
    }

    return zipPath;
  }
}
