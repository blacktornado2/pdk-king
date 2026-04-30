import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
  }

  tempPath(filename: string): string {
    return path.join(this.uploadDir, 'temp', filename);
  }

  outputPath(filename: string): string {
    return path.join(this.uploadDir, 'output', filename);
  }

  readFile(filePath: string): Buffer {
    return fs.readFileSync(filePath);
  }

  writeOutput(filename: string, data: Buffer): string {
    const dest = this.outputPath(filename);
    fs.writeFileSync(dest, data);
    return dest;
  }

  deleteFile(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }
}
