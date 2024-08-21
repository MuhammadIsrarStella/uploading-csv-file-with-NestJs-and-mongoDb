
import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ExcelFileUploadService } from '../Excel-file-upload-service';

@Injectable()
export class FileUploadService {
  constructor(private readonly excelFileUploadService: ExcelFileUploadService) {}

  async handleFileUpload(file: Express.Multer.File, operation: 'POST' | 'UPDATE') {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      if (operation === 'POST') {
        return await this.excelFileUploadService.processNewFile(file.buffer);
      } else if (operation === 'UPDATE') {
        return await this.excelFileUploadService.updateExistingFile(file.buffer);
      }
    } catch (error) {
      console.log("Error object:", error);
      console.log("Error message:", error.message);

      if (error instanceof HttpException) {
        const response = error.getResponse();
        throw new HttpException({
          statusCode: error.getStatus(),
          message: Array.isArray(response['message']) ? response['message'].join(', ') : response['message'],
          error: response['error'] || 'Bad Request',
          timestamp: new Date().toISOString(),
          path: '',
        }, error.getStatus());
      } else {
        throw new BadRequestException({
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message || 'An unexpected error occurred',
          error: 'Bad Request',
          timestamp: new Date().toISOString(),
          path: '', 
        });
      }
    }
  }
}

