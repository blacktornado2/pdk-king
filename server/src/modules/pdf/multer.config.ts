import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';

export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: './uploads/temp',
    filename: (_req, file, cb) => {
      cb(null, `${uuidv4()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new BadRequestException('Only PDF files are allowed'), false);
    }
    cb(null, true);
  },
};
