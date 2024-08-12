import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExcelFileData, ExcelFileDataDocument } from 'src/schema/Excel-file-data';
import { ExcelFileProcessor } from './strategies/excel-file-processor.strategy';
import { ProcessedData } from 'src/interfaces/Processed-data';


@Injectable()
export class ExcelFileUploadService {
  constructor(
    @InjectModel(ExcelFileData.name) private excelFileDataModel: Model<ExcelFileDataDocument>,
    private readonly excelFileProcessor: ExcelFileProcessor
  ) {}

  async uploadFile(buffer: Buffer): Promise<ProcessedData[]> {
    try {
      return await this.excelFileProcessor.processingFile(buffer);
    } catch (error) {
      console.error('Error in uploadFile:', error.message);
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new BadRequestException(error.message || 'Invalid file format or data');
      }
    }
  }
}
