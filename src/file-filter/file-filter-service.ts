
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileFilterService {
  validateFileType(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided. Please upload a valid file.');
    }

    const allowedMimeTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Please upload an Excel or CSV file.`);
    }
  }
}
