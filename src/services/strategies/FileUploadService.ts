import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ExcelFileUploadService } from '../Excel-file-upload-service';

@Injectable()
export class FileUploadService {
  constructor(private readonly excelFileUploadService: ExcelFileUploadService) {}

  async handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      const jsonData = await this.excelFileUploadService.uploadFile(file.buffer);
      return jsonData;
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
