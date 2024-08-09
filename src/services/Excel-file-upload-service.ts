
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExcelFileProcessor } from './strategies/excel-file-processor.strategy';
import { ExcelFileData, ExcelFileDataDocument } from '../schema/Excel-file-data';
import { ProcessedData } from '../interfaces/Processed-data';

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
      throw new BadRequestException('Invalid file format or data');
    }
  }
}
