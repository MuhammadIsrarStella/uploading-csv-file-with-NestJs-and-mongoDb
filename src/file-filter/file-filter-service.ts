import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileFilterService {
  validateFileType(file: Express.Multer.File): void {
    if (!file.mimetype.match(/\/(csv|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet)$/)) {
      throw new BadRequestException('Only CSV and Excel files are allowed!');
    }
  }
}
